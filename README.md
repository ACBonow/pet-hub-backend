# PetHUB — Backend

API REST do PetHUB. Construída com **Fastify**, **Prisma** e **Supabase** (PostgreSQL + Storage), deployada na **Vercel**.

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) com projeto criado
- Conta no [Resend](https://resend.com) para envio de e-mails

---

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com os valores do seu projeto Supabase e Resend. Veja a seção [Variáveis de ambiente](#variáveis-de-ambiente) para descrição de cada campo.

### 3. Rodar as migrations

```bash
npm run db:deploy
```

> Para criar uma nova migration em desenvolvimento: `npm run db:migrate`

### 4. Gerar o cliente Prisma

```bash
npm run db:generate
```

### 5. Iniciar o servidor em modo dev

```bash
npm run dev
```

O servidor sobe em `http://localhost:3000`.

---

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia em modo watch (tsx) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Inicia a build compilada |
| `npm test` | Roda os testes unitários (Jest) |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run db:migrate` | Cria e aplica migration (dev) |
| `npm run db:deploy` | Aplica migrations pendentes (produção) |
| `npm run db:generate` | Regenera o cliente Prisma |
| `npm run db:studio` | Abre o Prisma Studio |

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL do pooler Supabase (porta 6543, `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | Não | URL direta Supabase (porta 5432) — apenas para `prisma migrate` |
| `SUPABASE_URL` | Sim | URL do projeto Supabase (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de service role — nunca exposta no frontend |
| `SUPABASE_ANON_KEY` | Sim | Chave anon — usada para acesso público ao Storage |
| `JWT_SECRET` | Sim | Segredo do access token (mínimo 32 caracteres) |
| `JWT_REFRESH_SECRET` | Sim | Segredo do refresh token (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | Não | Expiração do access token (padrão: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Não | Expiração do refresh token (padrão: `7d`) |
| `CORS_ORIGIN` | Sim | Origem permitida pelo CORS (ex: `https://pethub.vercel.app`) |
| `RESEND_API_KEY` | Sim | Chave da API do Resend para envio de e-mails |
| `EMAIL_FROM` | Não | Endereço de envio (padrão: `noreply@tche-pethub.com`) |
| `FRONTEND_URL` | Não | URL do frontend — usada nos links dos e-mails (padrão: `http://localhost:5173`) |
| `PORT` | Não | Porta do servidor (padrão: `3000`) |
| `NODE_ENV` | Não | Ambiente: `development`, `production` ou `test` |

> O servidor **não sobe** se alguma variável obrigatória estiver ausente — a validação é feita via Zod na inicialização.

---

## Supabase Storage

Os buckets abaixo precisam existir no projeto Supabase com acesso **público para leitura**:

| Bucket | Conteúdo |
|--------|----------|
| `pet-images` | Fotos de pets |
| `org-images` | Fotos/logos de organizações |
| `service-images` | Fotos de serviços |
| `exam-files` | Arquivos de exames (acesso privado) |

---

## Arquitetura

```
src/
├── modules/          # Módulos de domínio (auth, person, organization, pet, ...)
│   └── <module>/
│       ├── <module>.routes.ts
│       ├── <module>.controller.ts
│       ├── <module>.service.ts
│       ├── <module>.repository.ts
│       ├── <module>.schema.ts
│       ├── <module>.types.ts
│       └── __tests__/
├── shared/           # Infra compartilhada (AppError, logger, env, storage, utils)
├── app.ts            # Instância do Fastify com plugins registrados
└── server.ts         # Entry point
```

Fluxo de uma requisição: `routes → controller → service → repository → Prisma`

---

## Deploy (Vercel)

O projeto usa `vercel.json` que direciona todo o tráfego para `api/index.ts`.

Variáveis de ambiente de produção devem ser configuradas no painel da Vercel ou via `vercel env add`.

Após o deploy, aplicar as migrations no banco de produção:

```bash
npx prisma migrate deploy
```

---

## Testes

```bash
npm test                 # Todos os testes
npm run test:coverage    # Com cobertura (mínimo: 80% statements/lines, 75% branches, 85% functions)
```

> Testes de integração com banco real requerem `.env` configurado e usam um banco de test isolado.
