# Deploy — Rumo API na AWS

> Contexto salvo em 22/06/2026. Continuar a partir daqui após reiniciar.

---

## Situação atual

- **rumo** (frontend Next.js): `C:\Users\guilh\rumo` — GitHub: `Guilherme-Ramos-Nepomuceno/rumo`
- **rumo-api** (backend Laravel): `C:\Users\guilh\rumo-api` — GitHub: `Guilherme-Ramos-Nepomuceno/rumo-api`
- **AWS** configurada em `~/.aws/` com região `us-east-2` (Ohio), profile `JP`
- **rumo-api tem mudanças não commitadas** (ver seção abaixo)

---

## Decisão de arquitetura

**Opção escolhida: mais barata**
- EC2 com Docker (sem ECS/Fargate)
- PostgreSQL em container Docker separado (sem RDS)
- GHCR (GitHub Container Registry) para a imagem — gratuito
- Custo estimado: ~$8-15/mês (EC2 t3.micro + EBS + Elastic IP)

---

## Arquivos criados no rumo-api

Três arquivos novos foram criados em `C:\Users\guilh\rumo-api`:

### `docker-compose.db.yml`
Sobe apenas o PostgreSQL. **Roda uma vez no servidor, nunca é tocado pelo CI/CD.**
- Cria a rede Docker `rumo-backend`
- Dados persistem no volume `pgsql-data`

### `docker-compose.prod.yml`
Sobe apenas app (PHP-FPM) + nginx. **É o que o CI/CD atualiza a cada deploy.**
- Puxa imagem do GHCR: `ghcr.io/guilherme-ramos-nepomuceno/rumo-api:latest`
- Usa a rede externa `rumo-backend` (criada pelo compose do banco)
- Lê variáveis do `.env` na EC2

### `.github/workflows/deploy.yml`
GitHub Actions que roda a cada push na `main`:
1. Builda a imagem Docker (target: production)
2. Faz push no GHCR
3. SSH na EC2 → puxa nova imagem → reinicia só `app` e `nginx`
4. Banco **nunca é tocado**

---

## Fluxo de deploy

```
git push origin main
    ↓
GitHub Actions
    ↓ build imagem
    ↓ push → ghcr.io/guilherme-ramos-nepomuceno/rumo-api:latest
    ↓ SSH na EC2
    ↓ docker compose -f docker-compose.prod.yml pull app
    ↓ docker compose -f docker-compose.prod.yml up -d --no-deps app nginx
    ↓ docker image prune -f
    ✅ Banco intocado, dados preservados
```

---

## O que falta fazer (próximos passos)

### 1. Commitar mudanças pendentes no rumo-api

Há arquivos modificados e não commitados:
- `AuthController.php`, `CategoryController.php`, `StatsController.php`, `SyncController.php`, `TaskController.php`
- `TaskResource.php`, `Task.php`, `User.php`
- `bootstrap/app.php`, `composer.json`, `routes/api.php`
- Novos: `ObjectiveController.php`, `JwtAuthenticate.php`, `Objective.php`, `JwtService.php`, `cors.php`, `jwt.php`

```bash
cd C:\Users\guilh\rumo-api
git add .
git commit -m "feat: add objectives, JWT auth, CORS config and CI/CD pipeline"
git push origin main
```

> ⚠️ Confirmar antes: o `.env` está no `.gitignore` (está, pode commitar sem risco).

### 2. Criar a EC2 na AWS

- Tipo: `t3.micro` (free tier se elegível, senão ~$8/mês)
- AMI: Ubuntu 22.04 LTS
- Região: `us-east-2` (Ohio, já configurada)
- Security Group: liberar portas 22 (SSH), 80 (HTTP), 443 (HTTPS futuramente)
- Criar e baixar o par de chaves `.pem`

### 3. Configurar Secrets no GitHub

Repositório `rumo-api` → Settings → Secrets → Actions:

| Secret | Como obter |
|--------|-----------|
| `EC2_HOST` | IP público da EC2 (ou Elastic IP) |
| `EC2_USER` | `ubuntu` para Ubuntu AMI |
| `EC2_SSH_KEY` | Conteúdo completo do arquivo `.pem` |
| `GHCR_TOKEN` | GitHub → Settings → Developer Settings → PAT com `read:packages` |

### 4. Setup inicial da EC2 (só uma vez)

```bash
# Conectar na EC2
ssh -i sua-chave.pem ubuntu@IP-DA-EC2

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Criar estrutura
sudo mkdir -p /opt/rumo-api/docker/nginx
sudo chown -R $USER /opt/rumo-api

# Copiar arquivos de configuração para a EC2
# (via scp ou clonar o repo)
cd /opt/rumo-api
git clone https://github.com/Guilherme-Ramos-Nepomuceno/rumo-api.git .

# Criar o .env de produção (ver seção abaixo)
nano .env

# Subir o banco (UMA VEZ, nunca mais)
docker compose -f docker-compose.db.yml up -d

# Verificar se o banco subiu
docker compose -f docker-compose.db.yml ps

# Subir o app pela primeira vez
docker compose -f docker-compose.prod.yml up -d
```

### 5. `.env` de produção na EC2

Criar `/opt/rumo-api/.env` com:

```env
APP_NAME=Rumo
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...          # Gerar: docker run --rm rumo-api:latest php artisan key:generate --show
APP_URL=http://IP-DA-EC2    # ou domínio quando tiver

DB_CONNECTION=pgsql
DB_HOST=pgsql               # nome do serviço no docker-compose.db.yml
DB_PORT=5432
DB_DATABASE=rumo
DB_USERNAME=rumo
DB_PASSWORD=SENHA_FORTE     # mínimo 20 chars, trocar do "secret" padrão

SESSION_DRIVER=database
SESSION_LIFETIME=120
QUEUE_CONNECTION=database
CACHE_STORE=database

LOG_CHANNEL=stack
LOG_LEVEL=warning

JWT_SECRET=GERAR_COM_openssl_rand_-base64_64
```

### 6. CORS — atualizar para o domínio de produção

Arquivo `C:\Users\guilh\rumo-api\config\cors.php`:
```php
'allowed_origins' => [
    'http://localhost:3000',     // dev local
    'http://IP-OU-DOMINIO',      // produção frontend
],
```

### 7. Frontend — atualizar variável de ambiente

Em produção do frontend, `NEXT_PUBLIC_API_URL` precisa apontar para a EC2:
```env
NEXT_PUBLIC_API_URL=http://IP-DA-EC2/api/v1
```

---

## Bloqueadores críticos (identificados antes de reiniciar)

| # | Problema | Solução |
|---|----------|---------|
| 1 | `APP_KEY` vazia no `.env` | Gerar e fixar no `.env` da EC2 |
| 2 | `DB_HOST=pgsql` aponta pro Docker | OK para esta arquitetura — o postgres roda na rede `rumo-backend` com nome `pgsql` |
| 3 | `APP_ENV=local`, `APP_DEBUG=true` | Corrigir no `.env` da EC2 |
| 4 | CORS só permite `localhost:3000` | Adicionar IP/domínio da EC2 no `cors.php` |

---

## Observações

- O `docker-compose.yml` original **não muda** — continua sendo usado para dev local
- O banco na EC2 **nunca é recriado** pelo CI/CD, apenas o app e o nginx
- Imagens antigas são removidas automaticamente pelo `docker image prune -f` no deploy
- O volume `pgsql-data` persiste mesmo se o container do banco for parado/reiniciado
