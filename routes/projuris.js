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

    // Transformar para o formato do dashboard
    const dashboardData = transformToDashboardFormat(tarefas);

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
    res.json({
      success: true,
      status: 'connected',
      message: 'Conexão com ProJuris OK'
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
 * Transforma dados da API ProJuris para o formato esperado pelo dashboard
 */
function transformToDashboardFormat(tarefas) {
  return tarefas.map(tarefa => {
    // Mapear campos da API para o formato do dashboard
    return {
      'SHEET': getMonthName(tarefa.dataDistribuicao || tarefa.dataCriacao),
      'ADVOGADO': tarefa.nomeResponsavel || tarefa.usuarioResponsavel?.nome || 'Não atribuído',
      'EQUIPE RESPONSÁVEL': tarefa.equipe?.nome || tarefa.departamento?.nome || 'Não definida',
      'TIPO DE TAREFA': tarefa.tipoTarefa?.descricao || tarefa.tipo || 'Não especificado',
      'ASSUNTO': tarefa.assunto || tarefa.titulo || tarefa.descricao || 'Sem assunto',
      'DATA DE DISTRIBUIÇÃO DA ATIVIDADE': parseApiDate(tarefa.dataDistribuicao || tarefa.dataCriacao),
      'DATA FATAL': parseApiDate(tarefa.dataLimite || tarefa.prazoFatal),
      'DATA DA CONCLUSÃO': parseApiDate(tarefa.dataConclusao),
      'STATUS': tarefa.status || (tarefa.dataConclusao ? 'Concluído' : 'Pendente'),
      // Campos adicionais para referência
      '_id': tarefa.codigo || tarefa.id,
      '_original': tarefa
    };
  });
}

/**
 * Converte data da API para objeto Date
 */
function parseApiDate(dateValue) {
  if (!dateValue) return null;

  // Se já é uma data
  if (dateValue instanceof Date) return dateValue;

  // Se é timestamp
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // Se é string ISO
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
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
