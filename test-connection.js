/**
 * Script de teste de conexão com a API ProJuris
 * Execute: node test-connection.js
 */

require('dotenv').config();
const projurisClient = require('./services/projurisClient');

async function testConnection() {
  console.log('🧪 Testando conexão com API ProJuris...\n');

  try {
    // Teste 1: Obter token
    console.log('1️⃣  Testando autenticação OAuth2...');
    const token = await projurisClient.getToken();
    console.log('✅ Token obtido com sucesso!');
    console.log(`   Token (primeiros 20 chars): ${token.substring(0, 20)}...`);
    console.log('');

    // Teste 2: Buscar tarefas
    console.log('2️⃣  Testando busca de tarefas...');
    const tarefasResponse = await projurisClient.getTarefas({ page: 0, size: 5 });
    console.log('✅ Tarefas recuperadas com sucesso!');
    console.log(`   Total de tarefas na primeira página: ${tarefasResponse.content?.length || 0}`);
    console.log(`   Total de páginas: ${tarefasResponse.totalPages || 'N/A'}`);
    console.log(`   Total de elementos: ${tarefasResponse.totalElements || 'N/A'}`);
    console.log('');

    // Teste 3: Buscar todas as tarefas (com limite)
    console.log('3️⃣  Testando busca completa de tarefas...');
    const allTarefas = await projurisClient.getAllTarefas();
    console.log('✅ Busca completa concluída!');
    console.log(`   Total de tarefas recuperadas: ${allTarefas.length}`);
    console.log('');

    // Exibir amostra de dados
    if (allTarefas.length > 0) {
      console.log('📋 Amostra da primeira tarefa:');
      const firstTask = allTarefas[0];
      console.log(JSON.stringify(firstTask, null, 2).substring(0, 500) + '...');
      console.log('');
    }

    console.log('✅ Todos os testes passaram com sucesso!');
    console.log('');
    console.log('🎉 A integração com a API ProJuris está funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro durante os testes:');
    console.error(`   Mensagem: ${error.message}`);
    if (error.response) {
      console.error(`   Status HTTP: ${error.response.status}`);
      console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.error('');
    console.error('💡 Dicas:');
    console.error('   - Verifique se as credenciais no .env estão corretas');
    console.error('   - Confirme se o usuário tem permissão na API ProJuris');
    console.error('   - Verifique sua conexão com a internet');
    console.error('   - Consulte a documentação: https://docs.projurisadv.com.br/');
    process.exit(1);
  }
}

// Executar teste
testConnection();
