# Guia de Deploy

Este documento fornece instruções para fazer deploy do Dashboard ProJuris em diferentes ambientes.

## 🚀 Deploy Local (Desenvolvimento)

```bash
npm install
npm start
```

Acesse: `http://localhost:3000`

## 🌐 Deploy em Servidor (Produção)

### Opção 1: PM2 (Recomendado para Node.js)

#### 1. Instale o PM2 globalmente

```bash
npm install -g pm2
```

#### 2. Configure o arquivo ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'projuris-dashboard',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### 3. Inicie com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Configure Nginx como proxy reverso

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opção 2: Docker

#### 1. Crie o Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. Crie o docker-compose.yml

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
```

#### 3. Execute

```bash
docker-compose up -d
```

### Opção 3: Heroku

#### 1. Crie o Procfile

```
web: node server.js
```

#### 2. Configure as variáveis de ambiente

```bash
heroku config:set PROJURIS_DOMAIN=seu_dominio
heroku config:set PROJURIS_USER=seu_usuario
# ... outras variáveis
```

#### 3. Deploy

```bash
git push heroku main
```

### Opção 4: Windows Server com IIS

Se você prefere usar IIS (como indicado pelo seu web.config original):

#### 1. Instale o iisnode

Baixe e instale: https://github.com/Azure/iisnode

#### 2. Crie o web.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <iisnode nodeProcessCommandLine="C:\Program Files\nodejs\node.exe" />
  </system.webServer>
</configuration>
```

#### 3. Configure o site no IIS

1. Crie um novo site apontando para a pasta do projeto
2. Configure as variáveis de ambiente no IIS
3. Reinicie o Application Pool

## 🔒 Segurança em Produção

### 1. Configure HTTPS

Use Let's Encrypt com Certbot:

```bash
sudo certbot --nginx -d seu-dominio.com
```

### 2. Configure variáveis de ambiente seguras

Nunca commite o arquivo `.env`. Use:
- Variáveis de ambiente do sistema
- Secrets do Kubernetes
- AWS Secrets Manager
- Azure Key Vault

### 3. Adicione autenticação

Considere adicionar:
- Basic Auth no Nginx
- OAuth2 Proxy
- Sistema de login customizado

### 4. Configure firewall

Permita apenas portas necessárias:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📊 Monitoramento

### PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Logs

```bash
# Ver logs em tempo real
pm2 logs

# Ver logs de um app específico
pm2 logs projuris-dashboard

# Monitoramento
pm2 monit
```

## ⚡ Performance

### 1. Habilite compressão

Instale:

```bash
npm install compression
```

Adicione no `server.js`:

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Configure cache headers

```javascript
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

### 3. Use CDN para assets estáticos

Considere usar CloudFlare, AWS CloudFront, ou similar.

## 🔄 Backup e Recuperação

### Backup do código

```bash
# Git
git push origin main

# Backup local
tar -czf backup-$(date +%Y%m%d).tar.gz /caminho/do/projeto
```

### Backup de configurações

```bash
# Backup das variáveis de ambiente
cp .env .env.backup
```

## 📈 Escalabilidade

### Load Balancing com PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'projuris-dashboard',
    script: './server.js',
    instances: 'max', // Usa todos os CPUs disponíveis
    exec_mode: 'cluster'
  }]
}
```

### Redis para cache compartilhado

Se usar múltiplas instâncias, considere usar Redis:

```bash
npm install redis
```

---

**Dúvidas?** Consulte a documentação oficial do Node.js e Express.
