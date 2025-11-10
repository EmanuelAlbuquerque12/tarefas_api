// Estado global
let allData = [];
let filteredData = [];
let charts = {};

// Configuração da API
const API_BASE_URL = window.location.origin;
const API_ENDPOINT = `${API_BASE_URL}/api/projuris/tarefas`;

// Dias úteis por mês (aproximado)
const MONTH_WORKDAYS = {
  'JANEIRO': 22, 'FEVEREIRO': 20, 'MARÇO': 21, 'ABRIL': 22,
  'MAIO': 21, 'JUNHO': 20, 'JULHO': 23, 'AGOSTO': 22,
  'SETEMBRO': 21, 'OUTUBRO': 23, 'NOVEMBRO': 20, 'DEZEMBRO': 21
};

// Elementos DOM
const elements = {
  mainContent: document.getElementById('main-content'),
  sheetSelect: document.getElementById('sheet-select'),
  advogadoFilter: document.getElementById('advogado-filter'),
  equipeFilter: document.getElementById('equipe-filter'),
  assuntoFilter: document.getElementById('assunto-filter'),
  distDe: document.getElementById('dist-de'),
  distAte: document.getElementById('dist-ate'),
  fatalDe: document.getElementById('fatal-de'),
  fatalAte: document.getElementById('fatal-ate'),
  concDe: document.getElementById('conc-de'),
  concAte: document.getElementById('conc-ate'),
  clearFilters: document.getElementById('clear-filters'),
  exportCsv: document.getElementById('export-csv'),
  refreshData: document.getElementById('refresh-data'),
  clearCache: document.getElementById('clear-cache'),
  errorMessage: document.getElementById('error-message'),
  errorDetails: document.getElementById('error-details'),
  loadingIndicator: document.getElementById('loading-indicator'),
  successMessage: document.getElementById('success-message'),
  apiStatus: document.getElementById('api-status'),
  produtividadeHint: document.getElementById('produtividade-hint'),
  total: document.getElementById('total'),
  concluidas: document.getElementById('concluidas'),
  prazo: document.getElementById('prazo'),
  tempoMedio: document.getElementById('tempo-medio'),
};

// Funções de mensagem
function showError(msg, details = '') {
  elements.errorMessage.textContent = msg;
  elements.errorDetails.textContent = details;
  elements.errorMessage.style.display = 'block';
  elements.errorDetails.style.display = details ? 'block' : 'none';
  elements.loadingIndicator.style.display = 'none';
  elements.successMessage.style.display = 'none';
}

function showSuccess(msg) {
  elements.successMessage.textContent = msg;
  elements.successMessage.style.display = 'block';
  elements.errorMessage.style.display = 'none';
  elements.errorDetails.style.display = 'none';
  elements.loadingIndicator.style.display = 'none';
}

function clearMessages() {
  elements.errorMessage.style.display = 'none';
  elements.errorDetails.style.display = 'none';
  elements.successMessage.style.display = 'none';
}

function showLoading() {
  elements.loadingIndicator.style.display = 'flex';
  clearMessages();
}

// Carrega dados da API
async function loadDataFromAPI() {
  showLoading();

  try {
    console.log('🔍 Buscando dados da API ProJuris...');

    const response = await fetch(API_ENDPOINT);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar dados');
    }

    allData = result.data.map(processDataRow);

    console.log(`✅ ${allData.length} tarefas carregadas`);

    elements.mainContent.classList.remove('disabled-section');
    updateSheetOptions();
    updateFilters();
    applyFilters();

    const now = new Date().toLocaleString('pt-BR');
    showSuccess(`✅ ${allData.length} tarefas carregadas com sucesso! Última atualização: ${now}`);
    updateApiStatus('Conectado', 'green');

  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    showError('Erro ao carregar dados da API ProJuris', error.message);
    updateApiStatus('Erro', 'red');
  }
}

// Processa linha de dados (conversão de datas)
function processDataRow(row) {
  return {
    ...row,
    'DATA DE DISTRIBUIÇÃO DA ATIVIDADE': parseDate(row['DATA DE DISTRIBUIÇÃO DA ATIVIDADE']),
    'DATA FATAL': parseDate(row['DATA FATAL']),
    'DATA DA CONCLUSÃO': parseDate(row['DATA DA CONCLUSÃO'])
  };
}

// Parse de data
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Atualiza opções de mês/sheet
function updateSheetOptions() {
  const months = [...new Set(allData.map(r => r.SHEET).filter(Boolean))].sort();

  elements.sheetSelect.innerHTML = '<option value="all">📅 Resultado do Ano</option>';
  months.forEach(month => {
    const opt = document.createElement('option');
    opt.value = month;
    opt.textContent = month;
    elements.sheetSelect.appendChild(opt);
  });
}

// Atualiza filtros
function updateFilters() {
  const advogados = [...new Set(allData.map(r => r.ADVOGADO).filter(Boolean))].sort();
  const equipes = [...new Set(allData.map(r => r['EQUIPE RESPONSÁVEL']).filter(Boolean))].sort();
  const assuntos = [...new Set(allData.map(r => r.ASSUNTO).filter(Boolean))].sort();

  populateSelect(elements.advogadoFilter, advogados, 'Todos');
  populateSelect(elements.equipeFilter, equipes, 'Todas');
  populateSelect(elements.assuntoFilter, assuntos, 'Todos');
}

function populateSelect(select, options, defaultText) {
  select.innerHTML = `<option value="">${defaultText}</option>`;
  options.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

// Aplica filtros
function applyFilters() {
  clearMessages();

  let data = allData;

  if (elements.sheetSelect.value !== 'all') {
    data = data.filter(r => r.SHEET === elements.sheetSelect.value);
  }
  if (elements.advogadoFilter.value) {
    data = data.filter(r => r.ADVOGADO === elements.advogadoFilter.value);
  }
  if (elements.equipeFilter.value) {
    data = data.filter(r => r['EQUIPE RESPONSÁVEL'] === elements.equipeFilter.value);
  }
  if (elements.assuntoFilter.value) {
    data = data.filter(r => r.ASSUNTO === elements.assuntoFilter.value);
  }

  const dateFilters = [
    { el: elements.distDe, key: 'DATA DE DISTRIBUIÇÃO DA ATIVIDADE', op: '>=' },
    { el: elements.distAte, key: 'DATA DE DISTRIBUIÇÃO DA ATIVIDADE', op: '<=' },
    { el: elements.fatalDe, key: 'DATA FATAL', op: '>=' },
    { el: elements.fatalAte, key: 'DATA FATAL', op: '<=' },
    { el: elements.concDe, key: 'DATA DA CONCLUSÃO', op: '>=' },
    { el: elements.concAte, key: 'DATA DA CONCLUSÃO', op: '<=' },
  ];

  dateFilters.forEach(f => {
    if (f.el.value) {
      const filterDate = new Date(f.el.value + 'T00:00:00');
      data = data.filter(r => {
        if (!r[f.key]) return false;
        return f.op === '>=' ? r[f.key] >= filterDate : r[f.key] <= filterDate;
      });
    }
  });

  filteredData = data;
  updateTotals();
  updateCharts();
  saveState();

  if (filteredData.length === 0 && allData.length > 0) {
    showError('Nenhum dado encontrado com os filtros aplicados.');
  }
}

// Limpa filtros
function clearFilters() {
  elements.sheetSelect.value = 'all';
  elements.advogadoFilter.value = '';
  elements.equipeFilter.value = '';
  elements.assuntoFilter.value = '';
  elements.distDe.value = '';
  elements.distAte.value = '';
  elements.fatalDe.value = '';
  elements.fatalAte.value = '';
  elements.concDe.value = '';
  elements.concAte.value = '';
  applyFilters();
}

// Atualiza totais/KPIs
function updateTotals() {
  const total = filteredData.length;
  const concluidas = filteredData.filter(r => r['DATA DA CONCLUSÃO']).length;
  const pctConcl = total ? Math.round(concluidas / total * 100) : 0;
  const noPrazo = filteredData.filter(r =>
    r['DATA DA CONCLUSÃO'] && r['DATA FATAL'] && r['DATA DA CONCLUSÃO'] <= r['DATA FATAL']
  ).length;
  const pctPrazo = concluidas ? Math.round(noPrazo / concluidas * 100) : 0;

  const tempos = filteredData
    .filter(r => r['DATA DE DISTRIBUIÇÃO DA ATIVIDADE'] && r['DATA DA CONCLUSÃO'])
    .map(r => (r['DATA DA CONCLUSÃO'] - r['DATA DE DISTRIBUIÇÃO DA ATIVIDADE']) / (1000 * 60 * 60 * 24));
  const tempoMedio = tempos.length ? (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1) : 0;

  elements.total.textContent = total;
  elements.concluidas.textContent = `${concluidas} (${pctConcl}%)`;
  elements.prazo.textContent = `${pctPrazo}%`;
  elements.tempoMedio.textContent = tempoMedio;
}

// Atualiza gráficos
function updateCharts() {
  Object.values(charts).forEach(ch => ch?.destroy());
  charts = {};

  calculateProductivity();

  const tipos = groupBy(filteredData, 'TIPO DE TAREFA');
  charts.tipo = new Chart(document.getElementById('chart-tipo'), {
    type: 'pie',
    data: {
      labels: Object.keys(tipos),
      datasets: [{
        data: Object.values(tipos),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  const assuntos = groupBy(filteredData, 'ASSUNTO');
  const sorted = Object.entries(assuntos).sort((a, b) => b[1] - a[1]);
  let top = sorted.slice(0, 10);
  const outros = sorted.slice(10).reduce((s, [, v]) => s + v, 0);
  if (outros > 0) top.push(['Outros', outros]);

  charts.assunto = new Chart(document.getElementById('chart-assunto'), {
    type: 'bar',
    data: {
      labels: top.map(([k]) => k),
      datasets: [{ data: top.map(([, v]) => v), backgroundColor: '#3b82f6' }]
    },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
  });

  const status = {
    'Concluído': filteredData.filter(r => r['DATA DA CONCLUSÃO']).length,
    'Pendente': filteredData.length - filteredData.filter(r => r['DATA DA CONCLUSÃO']).length
  };
  charts.status = new Chart(document.getElementById('chart-status'), {
    type: 'pie',
    data: {
      labels: Object.keys(status),
      datasets: [{ data: Object.values(status), backgroundColor: ['#10b981', '#ef4444'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  const noPrazo = filteredData.filter(r =>
    r['DATA DA CONCLUSÃO'] && r['DATA FATAL'] && r['DATA DA CONCLUSÃO'] <= r['DATA FATAL']
  ).length;
  const atrasadas = filteredData.filter(r =>
    r['DATA DA CONCLUSÃO'] && r['DATA FATAL'] && r['DATA DA CONCLUSÃO'] > r['DATA FATAL']
  ).length;

  charts.prazo = new Chart(document.getElementById('chart-prazo'), {
    type: 'bar',
    data: {
      labels: ['No Prazo', 'Atrasadas'],
      datasets: [{ data: [noPrazo, atrasadas], backgroundColor: ['#10b981', '#ef4444'] }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

// Calcula produtividade
function calculateProductivity() {
  const selectedSheet = elements.sheetSelect.value;
  const selectedEquipe = elements.equipeFilter.value;
  let dataForCalc = filteredData;

  if (selectedSheet === 'all') {
    dataForCalc = allData;
  }

  if (selectedEquipe) {
    dataForCalc = dataForCalc.filter(r => r['EQUIPE RESPONSÁVEL'] === selectedEquipe);
  }

  const lawyerCounts = {};
  dataForCalc.forEach(r => {
    if (r.ADVOGADO) {
      lawyerCounts[r.ADVOGADO] = (lawyerCounts[r.ADVOGADO] || 0) + 1;
    }
  });

  let totalWorkdays = 0;
  if (selectedSheet === 'all') {
    totalWorkdays = Object.values(MONTH_WORKDAYS).reduce((a, b) => a + b, 0);
  } else {
    totalWorkdays = MONTH_WORKDAYS[selectedSheet.toUpperCase()] || 21;
  }

  const productivity = [];
  for (const [lawyer, count] of Object.entries(lawyerCounts)) {
    productivity.push({
      lawyer: lawyer,
      actions: count,
      productivity: (count / totalWorkdays).toFixed(2)
    });
  }

  productivity.sort((a, b) => b.productivity - a.productivity);

  const labels = productivity.map(p => p.lawyer);
  const data = productivity.map(p => parseFloat(p.productivity));

  if (charts.produtividade) charts.produtividade.destroy();

  charts.produtividade = new Chart(document.getElementById('chart-produtividade'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ações / Dia Útil',
        data: data,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const lawyer = productivity[context.dataIndex];
              return `${lawyer.productivity} ações/dia (${lawyer.actions} ações totais)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Ações por Dia Útil' }
        }
      }
    }
  });

  const period = selectedSheet === 'all' ? 'ano completo' : `mês de ${selectedSheet}`;
  const equipeInfo = selectedEquipe ? ` - Equipe: ${selectedEquipe}` : '';
  elements.produtividadeHint.textContent =
    `Calculado para o ${period} (${totalWorkdays} dias úteis)${equipeInfo}. Total de advogados: ${productivity.length}.`;
}

function groupBy(data, key) {
  return data.reduce((acc, r) => {
    const v = r[key] || 'Não preenchido';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}

// Salva estado
function saveState() {
  const state = {
    selectedSheet: elements.sheetSelect.value,
    advogado: elements.advogadoFilter.value,
    equipe: elements.equipeFilter.value,
    assunto: elements.assuntoFilter.value,
    distDe: elements.distDe.value,
    distAte: elements.distAte.value,
    fatalDe: elements.fatalDe.value,
    fatalAte: elements.fatalAte.value,
    concDe: elements.concDe.value,
    concAte: elements.concAte.value
  };
  try {
    localStorage.setItem('dashboardState', JSON.stringify(state));
  } catch (e) {
    console.warn('Erro ao salvar estado:', e);
  }
}

// Carrega estado
function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem('dashboardState'));
    if (state) {
      if (state.selectedSheet) elements.sheetSelect.value = state.selectedSheet;
      if (state.advogado) elements.advogadoFilter.value = state.advogado;
      if (state.equipe) elements.equipeFilter.value = state.equipe;
      if (state.assunto) elements.assuntoFilter.value = state.assunto;
      if (state.distDe) elements.distDe.value = state.distDe;
      if (state.distAte) elements.distAte.value = state.distAte;
      if (state.fatalDe) elements.fatalDe.value = state.fatalDe;
      if (state.fatalAte) elements.fatalAte.value = state.fatalAte;
      if (state.concDe) elements.concDe.value = state.concDe;
      if (state.concAte) elements.concAte.value = state.concAte;
    }
  } catch (e) {
    console.warn('Erro ao carregar estado:', e);
  }
}

// Exporta CSV
function exportCSV() {
  if (filteredData.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  const headers = Object.keys(filteredData[0]).filter(k => !k.startsWith('_'));
  const csv = [
    headers.join(','),
    ...filteredData.map(row => headers.map(h => {
      const val = row[h];
      if (val instanceof Date) return val.toLocaleDateString('pt-BR');
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dashboard_projuris_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Limpa cache
async function clearCache() {
  try {
    showLoading();
    const response = await fetch(`${API_BASE_URL}/api/projuris/cache/clear`, { method: 'POST' });
    const result = await response.json();

    if (result.success) {
      showSuccess('Cache limpo! Recarregando dados...');
      setTimeout(loadDataFromAPI, 1000);
    } else {
      showError('Erro ao limpar cache', result.error);
    }
  } catch (error) {
    showError('Erro ao limpar cache', error.message);
  }
}

// Atualiza status da API
function updateApiStatus(status, color) {
  const colors = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600'
  };

  elements.apiStatus.innerHTML = `Status: <span class="${colors[color] || 'text-gray-600'}">${status}</span>`;
}

// Verifica saúde da API
async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projuris/health`);
    const result = await response.json();

    if (result.success) {
      updateApiStatus('Conectado', 'green');
    } else {
      updateApiStatus('Erro', 'red');
    }
  } catch (error) {
    updateApiStatus('Desconectado', 'red');
  }
}

// Event Listeners
elements.sheetSelect.addEventListener('change', applyFilters);
elements.advogadoFilter.addEventListener('change', applyFilters);
elements.equipeFilter.addEventListener('change', applyFilters);
elements.assuntoFilter.addEventListener('change', applyFilters);
elements.distDe.addEventListener('change', applyFilters);
elements.distAte.addEventListener('change', applyFilters);
elements.fatalDe.addEventListener('change', applyFilters);
elements.fatalAte.addEventListener('change', applyFilters);
elements.concDe.addEventListener('change', applyFilters);
elements.concAte.addEventListener('change', applyFilters);
elements.clearFilters.addEventListener('click', clearFilters);
elements.exportCsv.addEventListener('click', exportCSV);
elements.refreshData.addEventListener('click', loadDataFromAPI);
elements.clearCache.addEventListener('click', clearCache);

// Inicialização
loadState();
checkApiHealth();
loadDataFromAPI();

// Auto-refresh a cada 5 minutos
setInterval(loadDataFromAPI, 5 * 60 * 1000);
