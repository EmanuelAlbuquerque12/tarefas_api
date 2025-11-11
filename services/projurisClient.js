const { exec } = require('child_process');
const { promisify } = require('util');
const NodeCache = require('node-cache');

const execPromise = promisify(exec);

class ProjurisClient {
  constructor() {
    this.domain = process.env.PROJURIS_DOMAIN;
    this.user = process.env.PROJURIS_USER;
    this.password = process.env.PROJURIS_PASSWORD;
    this.apiUrl = process.env.PROJURIS_API_URL;
    this.tokenUrl = process.env.PROJURIS_TOKEN_URL;
    this.clientId = process.env.PROJURIS_CLIENT_ID;
    this.clientSecret = process.env.PROJURIS_CLIENT_SECRET;

    // Cache para o token (válido por 1 hora)
    this.tokenCache = new NodeCache({ stdTTL: 3600 });

    // Cache para dados (válido por 5 minutos)
    this.dataCache = new NodeCache({ stdTTL: 300 });

    // Endpoints alternativos para tentar
    this.tarefasEndpoints = [
      '/tarefa/consulta-com-paginacao',
      '/tarefas',
      '/tarefa',
      '/api/tarefas'
    ];
  }

  /**
   * Escapa caracteres especiais para uso em shell
   * Envolve o argumento em aspas simples e escapa aspas simples internas
   */
  escapeShellArg(arg) {
    if (!arg) return "''";
    // Envolver em aspas simples e escapar aspas simples internas com '\''
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }

  /**
   * Obtém token de autenticação OAuth2 usando curl
   */
  async getToken() {
    const cachedToken = this.tokenCache.get('access_token');
    if (cachedToken) {
      console.log('📦 Token obtido do cache');
      return cachedToken;
    }

    try {
      console.log('🔑 Obtendo novo token OAuth2...');

      // Usar --data-urlencode para lidar automaticamente com caracteres especiais
      const curlCommand = `curl -s -L -X POST '${this.tokenUrl}' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        --data-urlencode 'grant_type=password' \
        --data-urlencode 'username=${this.user}' \
        --data-urlencode 'password=${this.password}' \
        --data-urlencode 'client_id=${this.clientId}' \
        --data-urlencode 'client_secret=${this.clientSecret}'`;

      const { stdout, stderr } = await execPromise(curlCommand, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 30000
      });

      if (stderr && stderr.length > 0) {
        console.warn('⚠️  Curl stderr:', stderr.substring(0, 200));
      }

      console.log('📡 Resposta do servidor (primeiros 500 chars):', stdout.substring(0, 500));

      if (!stdout || stdout.trim().length === 0) {
        console.error('❌ Resposta vazia do servidor de autenticação');
        console.error('Comando executado:', curlCommand);
        throw new Error('Resposta vazia do servidor de autenticação');
      }

      let data;
      try {
        data = JSON.parse(stdout);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', stdout.substring(0, 500));
        console.error('Parse error:', parseError.message);
        throw new Error('Resposta inválida do servidor de autenticação');
      }

      const token = data.access_token;

      if (!token) {
        console.error('❌ Resposta da autenticação:', data);
        throw new Error(data.error_description || data.error || 'Token não encontrado na resposta');
      }

      this.tokenCache.set('access_token', token);

      console.log('✅ Token OAuth2 obtido com sucesso');
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter token:', error.message);
      throw new Error('Falha na autenticação com ProJuris: ' + error.message);
    }
  }

  /**
   * Faz requisição autenticada à API ProJuris usando curl
   */
  async makeRequest(endpoint, params = {}, method = 'GET') {
    const token = await this.getToken();

    try {
      // Construir query string
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.apiUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      console.log(`🌐 Requisição: ${method} ${endpoint}`);

      const curlCommand = `curl -s -L -X ${method} '${url}' \
        -H 'Authorization: Bearer ${token}' \
        -H 'Content-Type: application/json'`;

      const { stdout, stderr } = await execPromise(curlCommand, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer para respostas grandes
        timeout: 60000
      });

      if (stderr && stderr.length > 0) {
        console.warn('⚠️  Curl stderr:', stderr.substring(0, 200));
      }

      let data;
      try {
        data = JSON.parse(stdout);
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON da resposta:', stdout.substring(0, 500));
        throw new Error('Resposta inválida da API ProJuris');
      }

      return data;
    } catch (error) {
      console.error(`❌ Erro na requisição ${endpoint}:`, error.message);

      // Se o token expirou (401), limpar cache e tentar novamente
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔄 Token expirado, obtendo novo token...');
        this.tokenCache.del('access_token');
        const newToken = await this.getToken();

        const queryString = new URLSearchParams(params).toString();
        const url = `${this.apiUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

        const curlCommand = `curl -s -L -X ${method} '${url}' \
          -H 'Authorization: Bearer ${newToken}' \
          -H 'Content-Type: application/json'`;

        const { stdout } = await execPromise(curlCommand, {
          maxBuffer: 50 * 1024 * 1024,
          timeout: 60000
        });

        return JSON.parse(stdout);
      }

      throw error;
    }
  }

  /**
   * Busca tarefas tentando múltiplos endpoints
   */
  async getTarefas(filters = {}) {
    const cacheKey = `tarefas_${JSON.stringify(filters)}`;
    const cached = this.dataCache.get(cacheKey);
    if (cached) {
      console.log('📦 Retornando tarefas do cache');
      return cached;
    }

    console.log('🔍 Buscando tarefas da API ProJuris...');

    // Tentar diferentes endpoints
    for (const endpoint of this.tarefasEndpoints) {
      try {
        console.log(`📍 Tentando endpoint: ${endpoint}`);

        const params = {
          page: filters.page || 0,
          size: filters.size || 100,
          ...filters
        };

        const data = await this.makeRequest(endpoint, params);

        // Verificar se a resposta tem dados válidos
        let tarefasCount = 0;
        if (data.content) {
          tarefasCount = data.content.length;
        } else if (data.tarefas) {
          tarefasCount = data.tarefas.length;
        } else if (Array.isArray(data)) {
          tarefasCount = data.length;
        }

        console.log(`✅ Endpoint ${endpoint} retornou ${tarefasCount} tarefas`);

        if (tarefasCount > 0 || data.content || data.tarefas) {
          this.dataCache.set(cacheKey, data);
          return data;
        }
      } catch (error) {
        console.warn(`⚠️  Endpoint ${endpoint} falhou:`, error.message);
        continue; // Tentar próximo endpoint
      }
    }

    // Se nenhum endpoint funcionou, retornar estrutura vazia
    console.warn('⚠️  Nenhum endpoint de tarefas retornou dados');
    const emptyResult = { content: [], totalElements: 0, last: true };
    this.dataCache.set(cacheKey, emptyResult);
    return emptyResult;
  }

  /**
   * Busca detalhes de uma tarefa específica
   */
  async getTarefaDetalhes(codigoTarefa) {
    try {
      console.log(`🔍 Buscando detalhes da tarefa ${codigoTarefa}`);
      const data = await this.makeRequest(`/tarefa/${codigoTarefa}`);
      return data;
    } catch (error) {
      console.error(`❌ Erro ao buscar tarefa ${codigoTarefa}:`, error.message);
      throw error;
    }
  }

  /**
   * Busca todas as tarefas (com paginação automática)
   */
  async getAllTarefas(filters = {}) {
    let allTasks = [];
    let page = 0;
    let hasMore = true;
    const maxPages = 20; // Aumentado para 20 páginas (2000 tarefas)

    console.log('📊 Iniciando busca paginada de tarefas...');

    while (hasMore && page < maxPages) {
      try {
        const response = await this.getTarefas({ ...filters, page, size: 100 });

        // Extrair tarefas da resposta (suporta diferentes formatos)
        let tasks = [];
        if (response.content && Array.isArray(response.content)) {
          tasks = response.content;
        } else if (response.tarefas && Array.isArray(response.tarefas)) {
          tasks = response.tarefas;
        } else if (Array.isArray(response)) {
          tasks = response;
        }

        if (tasks.length > 0) {
          allTasks = allTasks.concat(tasks);
          console.log(`📄 Página ${page + 1}: ${tasks.length} tarefas (total: ${allTasks.length})`);
          page++;

          // Verificar se há mais páginas
          if (response.last === true || tasks.length < 100) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar página ${page}:`, error.message);
        hasMore = false;
      }
    }

    if (page >= maxPages) {
      console.warn(`⚠️  Limite de páginas atingido (${maxPages} páginas / ${allTasks.length} tarefas)`);
    }

    console.log(`✅ Total de ${allTasks.length} tarefas recuperadas`);
    return allTasks;
  }

  /**
   * Busca usuários responsáveis
   */
  async getUsuarios() {
    const cached = this.dataCache.get('usuarios');
    if (cached) return cached;

    try {
      console.log('👥 Buscando usuários...');
      const data = await this.makeRequest('/usuario');
      this.dataCache.set('usuarios', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      throw error;
    }
  }

  /**
   * Limpa todos os caches
   */
  clearCache() {
    this.tokenCache.flushAll();
    this.dataCache.flushAll();
    console.log('🗑️  Cache limpo com sucesso');
  }

  /**
   * Informações de status do cliente
   */
  getStatus() {
    return {
      tokenCached: this.tokenCache.has('access_token'),
      cacheKeys: this.dataCache.keys().length,
      apiUrl: this.apiUrl,
      user: this.user,
      endpoints: this.tarefasEndpoints
    };
  }
}

module.exports = new ProjurisClient();
