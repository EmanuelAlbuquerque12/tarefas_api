const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const projurisRoutes = require('./routes/projuris');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rotas da API
app.use('/api/projuris', projurisRoutes);

// Rota raiz - servir o dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard disponível em http://localhost:${PORT}`);
  console.log(`🔌 API disponível em http://localhost:${PORT}/api/projuris`);
});

module.exports = app;
