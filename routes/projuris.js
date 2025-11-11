const express = require('express');
const router = express.Router();
const projurisClient = require('../services/projurisClient');

/**
 * GET /api/projuris/tarefas
 * Busca tarefas da API ProJuris e retorna no formato esperado pelo dashboard
 */
router.get('/tarefas', async (req, res) => {
  try {
    console.log('📥 Requisição recebida para /api/projuris/tarefas');

    // Buscar todas as tarefas
    const tarefas = await projurisClient.getAllTarefas();

    console.log(`📊 Processando ${tarefas.length} tarefas...`);

    // Transformar para o formato do dashboard
    const dashboardData = transformToDashboardFormat(tarefas);

    console.log(`✅ ${dashboardData.length} tarefas formatadas para o dashboard`);

    res.json({
      success: true,
      total: dashboardData.length,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ Erro ao processar tarefas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/projuris/tarefas/:id
 * Busca detalhes de uma tarefa específica
 */
router.get('/tarefas/:id', async (req, res) => {
  try {
    const tarefa = await projurisClient.getTarefaDetalhes(req.params.id);
    res.json({
      success: true,
      data: tarefa
    });
  } catch (error) {
    console.error('❌ Erro ao buscar tarefa:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/projuris/cache/clear
 * Limpa o cache de dados
 */
router.post('/cache/clear', async (req, res) => {
  try {
    projurisClient.clearCache();
    res.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projuris/health
 * Verifica status da conexão com a API
 */
router.get('/health', async (req, res) => {
  try {
    await projurisClient.getToken();
    const status = projurisClient.getStatus();
    res.json({
      success: true,
      status: 'connected',
      message: 'Conexão com ProJuris OK',
      info: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/projuris/status
 * Retorna informações sobre o estado do cliente
 */
router.get('/status', async (req, res) => {
  try {
    const status = projurisClient.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Transforma dados da API ProJuris para o formato esperado pelo dashboard
 * Suporta múltiplos formatos de resposta da API
 */
function transformToDashboardFormat(tarefas) {
  if (!Array.isArray(tarefas)) {
    console.warn('⚠️  Tarefas não é um array:', typeof tarefas);
    return [];
  }

  return tarefas.map(tarefa => {
    // Extrair responsáveis (pode ser array ou string)
    let responsaveis = 'Não atribuído';
    if (tarefa.responsaveis) {
      if (Array.isArray(tarefa.responsaveis)) {
        responsaveis = tarefa.responsaveis.map(r => r.nome || r.nomeCompleto || r).join(', ');
      } else if (typeof tarefa.responsaveis === 'string') {
        responsaveis = tarefa.responsaveis;
      }
    } else if (tarefa.nomeResponsavel) {
      responsaveis = tarefa.nomeResponsavel;
    } else if (tarefa.usuarioResponsavel) {
      responsaveis = tarefa.usuarioResponsavel.nome || tarefa.usuarioResponsavel.nomeCompleto || 'Não atribuído';
    } else if (tarefa.responsavel) {
      responsaveis = tarefa.responsavel.nome || tarefa.responsavel.nomeCompleto || 'Não atribuído';
    }

    // Extrair equipe/grupo de trabalho
    let equipe = 'Não definida';
    if (tarefa.grupoTrabalho) {
      equipe = tarefa.grupoTrabalho.nome || tarefa.grupoTrabalho.descricao || tarefa.grupoTrabalho;
    } else if (tarefa.equipe) {
      equipe = tarefa.equipe.nome || tarefa.equipe.descricao || tarefa.equipe;
    } else if (tarefa.departamento) {
      equipe = tarefa.departamento.nome || tarefa.departamento.descricao || tarefa.departamento;
    } else if (tarefa['grupos_trabalho'] || tarefa['gruposTrabalho']) {
      const grupos = tarefa['grupos_trabalho'] || tarefa['gruposTrabalho'];
      if (Array.isArray(grupos) && grupos.length > 0) {
        equipe = grupos.map(g => g.nome || g.descricao || g).join(', ');
      } else if (typeof grupos === 'string') {
        equipe = grupos;
      }
    }

    // Extrair tipo de tarefa
    let tipoTarefa = 'Não especificado';
    if (tarefa.tipoTarefa) {
      tipoTarefa = tarefa.tipoTarefa.descricao || tarefa.tipoTarefa.nome || tarefa.tipoTarefa;
    } else if (tarefa.tipo) {
      tipoTarefa = typeof tarefa.tipo === 'object' ? (tarefa.tipo.descricao || tarefa.tipo.nome) : tarefa.tipo;
    } else if (tarefa['tipo_tarefa']) {
      tipoTarefa = tarefa['tipo_tarefa'];
    }

    // Extrair assunto/título
    let assunto = 'Sem assunto';
    if (tarefa.assunto) {
      assunto = tarefa.assunto;
    } else if (tarefa.titulo) {
      assunto = tarefa.titulo;
    } else if (tarefa.descricao) {
      assunto = tarefa.descricao.length > 100 ? tarefa.descricao.substring(0, 100) + '...' : tarefa.descricao;
    }

    // Datas - suportar múltiplos nomes de campos
    const dataDistribuicao = parseApiDate(
      tarefa.dataDistribuicao ||
      tarefa.dataCriacao ||
      tarefa['data_criacao'] ||
      tarefa.criadoEm ||
      tarefa['criado_em']
    );

    const dataBase = parseApiDate(
      tarefa.dataBase ||
      tarefa['data_base']
    );

    const dataPrevista = parseApiDate(
      tarefa.dataPrevista ||
      tarefa['data_prevista'] ||
      tarefa.prazo
    );

    const dataFatal = parseApiDate(
      tarefa.dataFatal ||
      tarefa.dataLimite ||
      tarefa.prazoFatal ||
      tarefa['data_fatal']
    );

    const dataConclusao = parseApiDate(
      tarefa.dataConclusao ||
      tarefa.concluidaEm ||
      tarefa['concluida_em'] ||
      tarefa['data_conclusao']
    );

    // Status e situação
    let status = 'Pendente';
    if (tarefa.status) {
      status = typeof tarefa.status === 'object' ? (tarefa.status.descricao || tarefa.status.nome) : tarefa.status;
    } else if (dataConclusao) {
      status = 'Concluído';
    }

    let situacao = '';
    if (tarefa.situacao) {
      situacao = typeof tarefa.situacao === 'object' ? (tarefa.situacao.descricao || tarefa.situacao.nome) : tarefa.situacao;
    }

    // Identificadores
    const id = tarefa.id || tarefa.codigo || tarefa.codigoTarefa || tarefa['identificador_tarefa'];
    const moduloId = tarefa.moduloId || tarefa.modulo?.id || tarefa['modulo_id'] || '';

    return {
      // Campos do dashboard original
      'SHEET': getMonthName(dataDistribuicao),
      'ADVOGADO': responsaveis,
      'EQUIPE RESPONSÁVEL': equipe,
      'TIPO DE TAREFA': tipoTarefa,
      'ASSUNTO': assunto,
      'DATA DE DISTRIBUIÇÃO DA ATIVIDADE': dataDistribuicao,
      'DATA FATAL': dataFatal,
      'DATA DA CONCLUSÃO': dataConclusao,
      'STATUS': status,

      // Campos adicionais para compatibilidade com formato Python/CSV
      'Identificador do módulo': moduloId,
      'Identificador da tarefa': id,
      'Responsáveis da tarefa': responsaveis,
      'Tipo de tarefa': tipoTarefa,
      'Data de criação': dataDistribuicao,
      'Data base': dataBase,
      'Data prevista': dataPrevista,
      'Data fatal': dataFatal,
      'Data da conclusão': dataConclusao,
      'Grupos de trabalho': equipe,
      'Situação': situacao,
      'Status': status,

      // Campos para referência e debug
      '_id': id,
      '_original': process.env.NODE_ENV === 'development' ? tarefa : undefined
    };
  });
}

/**
 * Converte data da API para objeto Date
 * Suporta múltiplos formatos: ISO string, timestamp, objetos Date
 */
function parseApiDate(dateValue) {
  if (!dateValue) return null;

  // Se já é uma data
  if (dateValue instanceof Date) return dateValue;

  // Se é timestamp (número)
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // Se é string ISO ou formato brasileiro
  if (typeof dateValue === 'string') {
    // Tentar parsear como ISO
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Tentar formato brasileiro DD/MM/YYYY
    const brDateMatch = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brDateMatch) {
      const [, day, month, year] = brDateMatch;
      const brDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(brDate.getTime())) {
        return brDate;
      }
    }
  }

  return null;
}

/**
 * Extrai nome do mês de uma data
 */
function getMonthName(dateValue) {
  const date = parseApiDate(dateValue);
  if (!date) return 'SEM DATA';

  const months = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  return months[date.getMonth()];
}

module.exports = router;
