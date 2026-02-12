# 🔧 Correção: Acesso Externo ao Frontend

## Problema
O frontend Vite está rodando mas não é acessível externamente (apenas em localhost).

## Solução

### 1. Parar o Frontend
```bash
# No terminal onde o frontend está rodando, pressione Ctrl+C
```

### 2. Atualizar vite.config.ts

O arquivo já foi atualizado com:
```typescript
server: {
  host: '0.0.0.0',  // ← Permite acesso externo
  port: 5173,
  allowedHosts: [    // ← Permite acesso pelo domínio
    'schemamanager.skyinone.net',
    'localhost',
    '127.0.0.1',
  ],
  proxy: { ... }
}
```

### 3. Reiniciar o Frontend
```bash
cd /deploysap/deploy-master/frontend
npm run dev
```

Agora você verá na saída:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/  ← Novo!
```

### 4. Verificar Firewall (se necessário)

Se ainda não conseguir acessar, verifique o firewall do Ubuntu:

```bash
# Ver regras atuais
sudo ufw status

# Liberar porta 5173 (Frontend) e 9090 (Backend)
sudo ufw allow 5173/tcp
sudo ufw allow 9090/tcp

# Recarregar firewall
sudo ufw reload
```

### 5. Acessar pelo Domínio

Agora você pode acessar:
- **Frontend**: `http://schemamanager.skyinone.net:5173`
- **Backend API**: `http://schemamanager.skyinone.net:9090/api/health`

## Configuração para Produção (Recomendado)

Para produção, é melhor usar Nginx como proxy reverso:

### 1. Build do Frontend
```bash
cd frontend
npm run build
```

### 2. Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/deploymaster
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name schemamanager.skyinone.net;
    
    # Frontend (arquivos estáticos buildados)
    root /deploysap/deploy-master/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. Ativar configuração
```bash
sudo ln -s /etc/nginx/sites-available/deploymaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Acesso sem porta
Agora você pode acessar simplesmente: `http://schemamanager.skyinone.net`

## Resumo Rápido

**Desenvolvimento (com :5173):**
```bash
# Parar frontend com Ctrl+C
# Reiniciar com:
cd frontend && npm run dev
# Acessar: http://schemamanager.skyinone.net:5173
```

**Produção (sem porta, via Nginx):**
```bash
cd frontend && npm run build
# Configurar nginx conforme acima
# Acessar: http://schemamanager.skyinone.net
```

## Verificação

```bash
# Testar se o frontend está ouvindo em todas interfaces
ss -tlnp | grep 5173

# Deve mostrar:
# 0.0.0.0:5173  (não apenas 127.0.0.1:5173)

# Testar backend
curl http://localhost:9090/api/health
```
