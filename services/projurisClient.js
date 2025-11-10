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
  }

  /**
   * Obtém token de autenticação OAuth2 usando curl
   */
  async getToken() {
    const cachedToken = this.tokenCache.get('access_token');
    if (cachedToken) {
      return cachedToken;
    }

    try {
      console.log('🔑 Obtendo token OAuth2 com curl...');

      const curlCommand = `curl -L -X POST "${this.tokenUrl}" \\
        -H "Content-Type: application/x-www-form-urlencoded" \\
        -d "grant_type=password&username=${encodeURIComponent(this.user)}&password=${encodeURIComponent(this.password)}&client_id=${encodeURIComponent(this.clientId)}&client_secret=${encodeURIComponent(this.clientSecret)}"`;

      const { stdout, stderr } = await execPromise(curlCommand);

      if (stderr && !stderr.includes('% Total')) {
        console.error('⚠️  Curl stderr:', stderr);
      }

      const data = JSON.parse(stdout);
      const token = data.access_token;

      if (!token) {
        throw new Error('Token não encontrado na resposta');
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
  async makeRequest(endpoint, params = {}) {
    const token = await this.getToken();

    try {
      // Construir query string
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.apiUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      const curlCommand = `curl -L -X GET "${url}" \\
        -H "Authorization: Bearer ${token}" \\
        -H "Content-Type: application/json"`;

      const { stdout, stderr } = await execPromise(curlCommand);

      if (stderr && !stderr.includes('% Total')) {
        console.error('⚠️  Curl stderr:', stderr);
      }

      const data = JSON.parse(stdout);
      return data;
    } catch (error) {
      console.error(`❌ Erro na requisição ${endpoint}:`, error.message);

      // Se o token expirou, limpar cache e tentar novamente
      if (error.message.includes('401')) {
        this.tokenCache.del('access_token');
        const newToken = await this.getToken();

        const queryString = new URLSearchParams(params).toString();
        const url = `${this.apiUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

        const curlCommand = `curl -L -X GET "${url}" \\
          -H "Authorization: Bearer ${newToken}" \\
          -H "Content-Type: application/json"`;

        const { stdout } = await execPromise(curlCommand);
        return JSON.parse(stdout);
      }

      throw error;
    }
  }

  /**
   * Busca tarefas com paginação
   */
  async getTarefas(filters = {}) {
    const cacheKey = `tarefas_${JSON.stringify(filters)}`;
    const cached = this.dataCache.get(cacheKey);
    if (cached) {
      console.log('📦 Retornando tarefas do cache');
      return cached;
    }

    try {
      console.log('🔍 Buscando tarefas da API ProJuris...');

      // Endpoint de consulta com paginação
      const params = {
        page: filters.page || 0,
        size: filters.size || 1000, // Buscar até 1000 tarefas por vez
        ...filters
      };

      const data = await this.makeRequest('/tarefa/consulta-com-paginacao', params);

      console.log(`✅ ${data.content?.length || 0} tarefas recuperadas`);

      this.dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar tarefas:', error.message);
      throw error;
    }
  }

  /**
   * Busca detalhes de uma tarefa específica
   */
  async getTarefaDetalhes(codigoTarefa) {
    try {
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

    while (hasMore) {
      const response = await this.getTarefas({ ...filters, page, size: 100 });

      if (response.content && response.content.length > 0) {
        allTasks = allTasks.concat(response.content);
        page++;
        hasMore = !response.last && response.content.length > 0;
      } else {
        hasMore = false;
      }

      // Limite de segurança: máximo 10 páginas (1000 tarefas)
      if (page >= 10) {
        console.warn('⚠️  Limite de páginas atingido (10 páginas / 1000 tarefas)');
        break;
      }
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
    console.log('🗑️  Cache limpo');
  }
}

module.exports = new ProjurisClient();
