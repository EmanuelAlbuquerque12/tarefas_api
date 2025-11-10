# Dashboard ProJuris - Integrado com API

Dashboard analítico para visualização de tarefas e produtividade jurídica, integrado diretamente com a API do ProJuris. Elimina a necessidade de upload manual de planilhas XLSX.

## 🚀 Início Rápido (Windows)

**Duplo-clique em:**
```
iniciar.bat
```

Isso é tudo! O script irá:
- ✅ Verificar pré-requisitos
- ✅ Instalar dependências
- ✅ Iniciar o servidor
- ✅ Abrir o navegador automaticamente

### Scripts Disponíveis (.bat)

| Script | Descrição |
|--------|-----------|
| `iniciar.bat` | 🟢 Inicia tudo automaticamente (RECOMENDADO) |
| `parar.bat` | 🔴 Para o servidor |
| `testar.bat` | 🧪 Testa conexão com API ProJuris |
| `configurar.bat` | ⚙️ Menu de configuração interativo |
| `abrir-dashboard.bat` | 🌐 Abre o navegador (servidor já rodando) |

**📖 Ver também:**
- [INICIO_RAPIDO.md](INICIO_RAPIDO.md) - Guia detalhado
- [LEIA-ME.txt](LEIA-ME.txt) - Instruções resumidas

---

## 🎯 Características

- **Integração Direta com API ProJuris**: Dados carregados automaticamente em tempo real
- **Visualização Completa**: KPIs, gráficos de produtividade, tipos de tarefa, assuntos, status e prazos
- **Filtros Avançados**: Por advogado, equipe, assunto, datas de distribuição, fatal e conclusão
- **Produtividade por Advogado**: Cálculo automático de ações/dia útil
- **Cache Inteligente**: Sistema de cache para otimizar performance
- **Exportação CSV**: Exporte dados filtrados para análise externa
- **Auto-refresh**: Atualização automática a cada 5 minutos
- **Estado Persistente**: Filtros salvos automaticamente no navegador

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Acesso à API ProJuris (credenciais configuradas)

## 🚀 Instalação

### Opção A: Automática (Windows - RECOMENDADO)

1. **Duplo-clique em `iniciar.bat`**
2. Siga as instruções na tela
3. Configure o `.env` quando solicitado
4. Pronto! 🎉

### Opção B: Manual (Todos os sistemas)

#### 1. Clone o repositório (se aplicável)

```bash
git clone <url-do-repositorio>
cd tarefas_api
```

#### 2. Instale as dependências

```bash
npm install
```

#### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
copy .env.example .env     # Windows
# ou
cp .env.example .env       # Linux/Mac
```

Edite o arquivo `.env` com suas credenciais ProJuris:

```env
PROJURIS_DOMAIN=servidor
PROJURIS_USER=sistemacassel@servidor.adv.br
PROJURIS_PASSWORD=CRrKrw9D63TvHi
PROJURIS_API_URL=https://api.projurisadv.com.br/adv-service
PROJURIS_TOKEN_URL=https://apigw.projurisadv.com.br/auth/token
PROJURIS_CLIENT_ID=api_cliente_codigo_12964
PROJURIS_CLIENT_SECRET=@2022@8da6df1ca4914b04a5df3566278e5393
PORT=3000
```

**⚠️ IMPORTANTE**: Não commite o arquivo `.env` com credenciais reais! Ele já está no `.gitignore`.

#### 4. Teste a conexão (opcional mas recomendado)

**Windows (duplo-clique):**
```
testar.bat
```

**Linha de comando:**
```bash
npm test
```

#### 5. Inicie o servidor

**Windows (duplo-clique):**
```
iniciar.bat
```

**Linha de comando:**
```bash
npm start
```

**Desenvolvimento com auto-reload:**
```bash
npm run dev
```

#### 6. Acesse o dashboard

O navegador abrirá automaticamente (se usar `iniciar.bat`), ou acesse manualmente:

```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
tarefas_api/
├── iniciar.bat                  # 🟢 Inicializador automático
├── parar.bat                    # 🔴 Para o servidor
├── testar.bat                   # 🧪 Testa conexão
├── configurar.bat               # ⚙️  Menu de configuração
├── abrir-dashboard.bat          # 🌐 Abre navegador
├── server.js                    # Servidor Express principal
├── package.json                 # Dependências do projeto
├── .env                         # Variáveis de ambiente (credenciais)
├── .env.example                 # Template de configuração
├── test-connection.js           # Script de teste de conexão
├── ecosystem.config.js          # Configuração PM2 (produção)
├── README.md                    # Este arquivo
├── INICIO_RAPIDO.md             # Guia de início rápido
├── LEIA-ME.txt                  # Instruções resumidas
├── CHANGELOG.md                 # Histórico de versões
├── DEPLOYMENT.md                # Guia de deploy
├── services/
│   └── projurisClient.js       # Cliente da API ProJuris
├── routes/
│   └── projuris.js             # Rotas da API local
└── public/
    ├── dashboard.html           # Interface do dashboard
    └── app.js                   # Lógica do frontend
```

## 🔌 Endpoints da API Local

### GET /api/projuris/tarefas
Retorna todas as tarefas formatadas para o dashboard.

**Resposta:**
```json
{
  "success": true,
  "total": 150,
  "data": [...]
}
```

### GET /api/projuris/tarefas/:id
Retorna detalhes de uma tarefa específica.

### GET /api/projuris/health
Verifica status da conexão com ProJuris.

**Resposta:**
```json
{
  "success": true,
  "status": "connected",
  "message": "Conexão com ProJuris OK"
}
```

### POST /api/projuris/cache/clear
Limpa o cache de dados.

## 🎨 Funcionalidades do Dashboard

### KPIs Principais
- Total de Tarefas
- Tarefas Concluídas (%)
- % no Prazo
- Tempo Médio de Conclusão (dias)

### Gráficos
1. **Produtividade por Advogado**: Ações/dia útil considerando dias úteis por mês
2. **Tipo de Tarefa**: Distribuição por pizza
3. **Assuntos**: Top 10 assuntos + outros
4. **Status**: Concluído vs Pendente
5. **Prazo**: No prazo vs Atrasadas

### Filtros Disponíveis
- Mês/Período (individual ou ano completo)
- Advogado
- Equipe
- Assunto
- Data de Distribuição (range)
- Data Fatal (range)
- Data de Conclusão (range)

## 🔧 Configuração Avançada

### Alterar porta do servidor

Edite o arquivo `.env`:

```env
PORT=8080
```

### Ajustar cache

No arquivo `services/projurisClient.js`, você pode ajustar:

```javascript
// Cache de token (padrão: 1 hora)
this.tokenCache = new NodeCache({ stdTTL: 3600 });

// Cache de dados (padrão: 5 minutos)
this.dataCache = new NodeCache({ stdTTL: 300 });
```

### Ajustar auto-refresh

No arquivo `public/app.js`:

```javascript
// Auto-refresh a cada 5 minutos (padrão)
setInterval(loadDataFromAPI, 5 * 60 * 1000);

// Altere para 10 minutos:
setInterval(loadDataFromAPI, 10 * 60 * 1000);
```

## 🛠️ Troubleshooting

### ❌ "Node.js não encontrado"
**Solução:** Instale o Node.js em https://nodejs.org/ (versão LTS recomendada)

### ❌ Erro de autenticação com ProJuris
**Soluções:**
1. Execute `configurar.bat` → Opção 1 (Editar .env)
2. Execute `testar.bat` para diagnosticar
3. Verifique se as credenciais estão corretas
4. Confirme se o usuário tem permissão na API ProJuris

### ❌ Dados não carregam
1. Execute `testar.bat` para verificar conexão
2. Verifique o console do navegador (F12)
3. Verifique os logs na janela do servidor
4. Teste o endpoint: `http://localhost:3000/api/projuris/health`
5. Use o botão "Limpar Cache" no dashboard

### ❌ "Porta 3000 já em uso"
**Solução:**
1. Execute `parar.bat` para encerrar processos anteriores
2. Ou edite `.env` e altere `PORT=3000` para outra porta

### ❌ "Erro ao instalar dependências"
**Soluções:**
1. Execute `configurar.bat` → Opção 2 (Reinstalar)
2. Verifique sua conexão com internet
3. Execute como Administrador

### ⚠️ Performance lenta
1. Ajuste o tamanho da página na requisição (arquivo `routes/projuris.js`)
2. Aumente o tempo de cache no `services/projurisClient.js`
3. Use o botão "Limpar Cache" se os dados estiverem desatualizados

## 📊 Mapeamento de Campos

O sistema mapeia automaticamente os campos da API ProJuris para o formato do dashboard:

| Campo API | Campo Dashboard |
|-----------|----------------|
| nomeResponsavel | ADVOGADO |
| equipe.nome | EQUIPE RESPONSÁVEL |
| tipoTarefa.descricao | TIPO DE TAREFA |
| assunto/titulo | ASSUNTO |
| dataDistribuicao | DATA DE DISTRIBUIÇÃO |
| dataLimite | DATA FATAL |
| dataConclusao | DATA DA CONCLUSÃO |

## 🔐 Segurança

- **Nunca** exponha este servidor diretamente à internet sem autenticação adicional
- **Sempre** use HTTPS em produção
- **Mantenha** o arquivo `.env` fora do controle de versão
- **Considere** implementar autenticação para o dashboard se for usado em rede

## 📝 Licença

Este projeto é proprietário e confidencial.

## 👥 Suporte

Para dúvidas sobre a API ProJuris, consulte:
- [Documentação Oficial](https://docs.projurisadv.com.br/)
- [Swagger UI](https://docs.projurisadv.com.br/ui/index.html)

---

**Desenvolvido com ⚖️ para otimizar a gestão jurídica**
