# 🚀 Guia de Início Rápido

## Opção 1: Usar o Inicializador Automático (RECOMENDADO)

### Para Windows:

**Duplo-clique no arquivo:**
```
iniciar.bat
```

Isso irá:
1. ✅ Verificar se Node.js está instalado
2. ✅ Instalar dependências automaticamente (se necessário)
3. ✅ Verificar configurações (.env)
4. ✅ Iniciar o servidor
5. ✅ Abrir o navegador automaticamente

---

## Scripts Disponíveis (Windows)

### 🟢 `iniciar.bat`
**Inicia tudo com um clique**
- Verifica pré-requisitos
- Instala dependências
- Inicia servidor
- Abre navegador

### 🔴 `parar.bat`
**Para o servidor**
- Encerra todos os processos Node.js

### 🧪 `testar.bat`
**Testa conexão com API ProJuris**
- Verifica autenticação
- Testa busca de dados
- Mostra problemas (se houver)

### ⚙️ `configurar.bat`
**Menu de configuração interativo**
- Editar credenciais (.env)
- Reinstalar dependências
- Limpar cache
- Verificar Node.js
- Abrir documentação

---

## Opção 2: Manual (Linha de Comando)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar credenciais
Edite o arquivo `.env` com suas credenciais ProJuris

### 3. Iniciar servidor
```bash
npm start
```

### 4. Abrir navegador
Acesse: http://localhost:3000

---

## ⚠️ Primeiro Uso

Na primeira execução de `iniciar.bat`:

1. Se o arquivo `.env` não existir, ele será criado automaticamente
2. Você será perguntado se quer editá-lo
3. **Configure suas credenciais ProJuris** antes de continuar

### Credenciais necessárias no `.env`:
```
PROJURIS_DOMAIN=servidor
PROJURIS_USER=seu_usuario@servidor.adv.br
PROJURIS_PASSWORD=sua_senha
PROJURIS_CLIENT_ID=seu_client_id
PROJURIS_CLIENT_SECRET=seu_client_secret
```

---

## 🆘 Problemas Comuns

### ❌ "Node.js não encontrado"
**Solução:** Instale o Node.js em https://nodejs.org/ (versão LTS recomendada)

### ❌ "Erro ao instalar dependências"
**Soluções:**
1. Execute `configurar.bat` → Opção 2 (Reinstalar)
2. Verifique sua conexão com internet
3. Execute como Administrador

### ❌ "Erro de autenticação com ProJuris"
**Soluções:**
1. Execute `configurar.bat` → Opção 1 (Editar .env)
2. Verifique se as credenciais estão corretas
3. Execute `testar.bat` para diagnosticar

### ❌ "Porta 3000 já em uso"
**Solução:**
1. Execute `parar.bat` para encerrar processos anteriores
2. Ou edite `.env` e altere `PORT=3000` para outra porta

---

## 📋 Fluxo de Trabalho Diário

### Iniciar o dia:
```
1. Duplo-clique em "iniciar.bat"
2. Dashboard abre automaticamente
3. Comece a usar!
```

### Finalizar o dia:
```
1. Duplo-clique em "parar.bat"
2. Pronto!
```

### Atualizar dados:
```
- Use o botão "Atualizar Dados" no dashboard
- Ou use o botão "Limpar Cache" para forçar atualização
```

---

## 📞 Suporte

- **Teste a conexão:** Execute `testar.bat`
- **Ver documentação completa:** Execute `configurar.bat` → Opção 5
- **Problemas persistentes:** Verifique os logs na janela do servidor

---

**Desenvolvido com ⚖️ para otimizar a gestão jurídica**
