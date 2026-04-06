# PetHUB — Coding Guidelines

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Naming Conventions](#naming-conventions)
4. [TDD Approach](#tdd-approach)
5. [Module Structure](#module-structure)
6. [Validation Rules](#validation-rules)
7. [API Design](#api-design)
8. [Mobile-First Design](#mobile-first-design)
9. [Error Handling](#error-handling)
10. [Environment & Deployment](#environment--deployment)
11. [Git Workflow](#git-workflow)

---

## Project Overview

PetHUB é um sistema web de gerenciamento de vida do pet (petcare / saúde animal), com design mobile-first e responsivo. Gerencia pessoas, organizações (empresas e ONGs), pets, listagens de adoção, relatórios de achados/perdidos, registros de saúde do pet e um diretório de serviços pet.

- **Backend**: Node.js + TypeScript, implantado na Vercel (serverless ou Node Pro)
- **Frontend**: React + TypeScript, implantado na Vercel
- **Metodologia**: Test-Driven Development (TDD)
- **Arquitetura**: Modular, feature-sliced

---

## Architecture

### Core Principle: Modular Architecture

Cada domínio é isolado em seu próprio módulo. Nenhum módulo importa diretamente dos internos de outro módulo. A comunicação entre módulos passa por interfaces bem definidas ou pela camada `shared/`.

### Backend Layers (per module)

```
routes → controller → service → repository → database
```

- **routes**: Definições de rotas HTTP, aplica middlewares.
- **controller**: Recebe a request, chama o service, envia a response. Sem lógica de negócio aqui.
- **service**: Toda a lógica de negócio. Funções puras onde possível. Testável sem HTTP.
- **repository**: Todas as queries de banco. Substituível (mock em testes, DB real em produção).
- **schema**: Schemas Zod para validação de request bodies e query params.
- **types**: Interfaces TypeScript e type aliases para este módulo.

### Frontend Layers (per module)

```
page/view → components → hooks → services → API client
```

- **components**: Apenas UI. Orientados a props. Sem chamadas diretas de API.
- **hooks**: Custom React hooks que combinam estado e chamadas de serviço.
- **services**: Funções puras que chamam o API client.
- **store**: Slice de estado global (Zustand) se necessário.
- **types**: Interfaces TypeScript específicas do módulo.

### Shared Layer

Código compartilhado entre módulos fica em `src/shared/`. Isso inclui:

- Validators (CPF, CNPJ)
- Middleware (backend) / componentes de layout (frontend)
- Classes de erro
- API client (frontend)
- Funções utilitárias

Um módulo pode importar de `shared/`. `shared/` nunca importa de um módulo.

---

## Naming Conventions

### Files

| Context       | Convention          | Example                          |
|---------------|---------------------|----------------------------------|
| Backend file  | camelCase           | `petHealth.service.ts`           |
| Frontend comp | PascalCase          | `VaccinationCard.tsx`            |
| Test file     | same name + `.test` | `pet.service.test.ts`            |
| Type file     | `index.ts`          | `src/modules/pet/types/index.ts` |
| Schema file   | `*.schema.ts`       | `pet.schema.ts`                  |

### Identifiers

| Context            | Convention  | Example                          |
|--------------------|-------------|----------------------------------|
| Variables          | camelCase   | `petOwner`, `cnpjValid`          |
| Functions          | camelCase   | `validateCpf()`, `getPetById()`  |
| Classes            | PascalCase  | `PetService`, `AppError`         |
| Interfaces         | PascalCase  | `IPet`, `IPersonRepository`      |
| Type aliases       | PascalCase  | `TutorshipType`, `OrgType`       |
| Constants          | UPPER_SNAKE | `MAX_CO_TUTORS`, `CPF_REGEX`     |
| Enum values        | UPPER_SNAKE | `OrgType.COMPANY`, `OrgType.NGO` |
| React components   | PascalCase  | `PetCard`, `AdoptionList`        |
| React hooks        | camelCase   | `usePetHealth`, `useAuth`        |

### Domain Terminology (decisão bilíngue)

O código usa **inglês** para todos os identificadores. Termos em português são usados apenas em comentários, strings voltadas ao usuário e documentação.

| Português       | Identificador no código |
|-----------------|------------------------|
| Pessoa          | Person / person        |
| Empresa         | Company / company      |
| ONG             | NGO / ngo              |
| Tutor           | Tutor / tutor          |
| Tutoria         | Tutorship              |
| Lar Temporário  | TemporaryHome          |

---

## TDD Approach

PetHUB segue o ciclo **Red → Green → Refactor** estritamente.

### Rules

1. Nenhum código de produção é escrito sem um teste falhando primeiro.
2. Escreva o código mínimo para o teste passar.
3. Refatore apenas no verde.
4. Todo método de service deve ter um teste unitário.
5. Todo controller deve ter um teste de integração (usando HTTP server de teste, sem DB real).
6. Todo validator deve ter testes cobrindo casos válidos, inválidos e de borda.
7. Repositories são sempre mockados em testes unitários. Testes de integração usam banco de teste.

### Test File Location

Testes ficam dentro de `__tests__/` dentro da pasta do módulo.

```
src/modules/person/__tests__/
  person.service.test.ts    ← unit test (repository mockado)
  person.controller.test.ts ← integration test (nível HTTP, DB mockado)
```

### Coverage Target

- Statements: mínimo 80%
- Branches: mínimo 80%
- Functions: mínimo 90%

### Test Naming

```typescript
describe('PersonService', () => {
  describe('create', () => {
    it('should throw if CPF is invalid', async () => { ... })
    it('should create person when CPF is valid', async () => { ... })
    it('should throw if email is already registered', async () => { ... })
  })
})
```

### Testing Tools (Backend)

- Test runner: **Jest**
- HTTP integration: **supertest**
- Mocking: Jest built-in mocks
- Database: in-memory ou test schema (nunca produção)

### Testing Tools (Frontend)

- Test runner: **Jest** + **React Testing Library**
- Component tests: render + user-event assertions
- Hook tests: `renderHook` do RTL
- Service tests: mock `fetch` / axios interceptors

---

## Module Structure

### Planned Modules

| Module              | Responsabilidade                                                       |
|---------------------|------------------------------------------------------------------------|
| auth                | Autenticação JWT, refresh tokens, login, register (cria User + Person atomicamente) |
| person              | CRUD de pessoas, validação de CPF, gerenciamento de perfil             |
| organization        | CRUD de orgs, papéis OWNER/MANAGER/MEMBER, gerenciamento de membros    |
| pet                 | CRUD de pets, tutoria, co-tutores, transferência, foto                 |
| adoption            | Listagens de adoção por pessoa ou organização (com validação de permissão) |
| lost-found          | Reportes de perdidos/achados por pessoa ou organização (com validação de permissão) |
| pet-health          | Carteirinha de vacinação, arquivos de exames                           |
| services-directory  | Diretório de serviços pet por pessoa ou organização (com validação de permissão) |

### Future Module

| Module    | Responsabilidade                      |
|-----------|---------------------------------------|
| genealogy | Árvore genealógica, registros de linhagem |

### Module Boundary Rules

- A pasta `__tests__/` de um módulo testa apenas aquele módulo.
- Um módulo exporta apenas o necessário via seu `index.ts`.
- Sem dependências circulares entre módulos.
- Tipos de domínio compartilhados vivem em `shared/types/`.

---

## Validation Rules

### CPF (Person)

- Deve ser um CPF brasileiro válido (11 dígitos, passa o algoritmo de dígito verificador).
- Armazenado como apenas dígitos (sem formatação) no banco.
- Exibido formatado (`000.000.000-00`) na UI.
- Unicidade garantida em nível de banco (constraint unique) e de service.

### CNPJ (Organization)

- **Empresa**: CNPJ obrigatório e válido.
- **ONG**: CNPJ opcional. Se fornecido, deve ser válido.
- O algoritmo padrão de dígito verificador do CNPJ deve passar.
- Armazenado como apenas dígitos. Exibido formatado (`00.000.000/0000-00`).

### Responsible Person & Roles (Organization)

- Toda organização deve ter pelo menos uma pessoa responsável no momento da criação.
- O criador recebe automaticamente o papel `OWNER`.
- Papéis: `OWNER` (total) > `MANAGER` (operacional) > `MEMBER` (criação básica).
- Verificação de papel centralizada em `shared/utils/org-permission.ts` — nunca inline.
- Não é possível remover ou rebaixar o último `OWNER` de uma organização.

### Criação de User + Person

- O endpoint `POST /api/v1/auth/register` cria `User` e `Person` em uma única transação Prisma.
- Não existe `User` sem `Person` associada — as duas entidades nascem juntas.
- Em caso de falha (CPF ou email duplicado), nenhum registro é criado.

### Tutorship (Pet)

- Um pet tem exatamente um tutor primário por vez (tipo: `owner | tutor | temporary-home`).
- Transferência de tutoria é uma operação explícita que cria um registro de histórico.
- Co-tutores são pessoas/orgs adicionais vinculadas ao pet sem tutoria primária.

---

## API Design

### Base URL

```
/api/v1/{module}/{resource}
```

Exemplos:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/persons/:id
POST   /api/v1/persons
GET    /api/v1/organizations/:id
POST   /api/v1/organizations
GET    /api/v1/pets/:id
POST   /api/v1/pets
POST   /api/v1/pets/:id/transfer-tutorship
GET    /api/v1/adoption
GET    /api/v1/lost-found
GET    /api/v1/pet-health/:petId/vaccination-card
GET    /api/v1/services-directory
```

### Response Envelope

Todas as respostas usam um envelope consistente:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 100 }
}
```

Respostas de erro:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CPF",
    "message": "O CPF informado não é válido.",
    "details": []
  }
}
```

### HTTP Status Codes

| Situação                   | Code |
|----------------------------|------|
| Sucesso (leitura)          | 200  |
| Criado                     | 201  |
| Sem conteúdo (delete)      | 204  |
| Requisição inválida        | 400  |
| Não autenticado            | 401  |
| Proibido                   | 403  |
| Não encontrado             | 404  |
| Conflito (duplicado)       | 409  |
| Erro de servidor           | 500  |

---

## Mobile-First Design

PetHUB é projetado primariamente para usuários mobile. Todas as decisões de UI partem de restrições mobile.

### Principles

1. **Layout**: Layouts padrão são de coluna única. Multi-coluna é adicionado via breakpoints.
2. **Navegação**: Bottom navigation bar é a navegação principal no mobile. Sidebar no desktop.
3. **Touch targets**: Mínimo 44x44px para todos os elementos interativos.
4. **Tipografia**: Tamanho de fonte base 16px mínimo. Nunca abaixo de 14px.
5. **Imagens**: Todas as imagens de pets usam `loading="lazy"` com `width`/`height` definidos.
6. **Formulários**: Inputs são full-width no mobile. Atributos `inputmode` apropriados para campos CPF/CNPJ.
7. **Performance**: Core Web Vitals — LCP < 2.5s, CLS < 0.1, INP < 200ms.

### Breakpoints

```css
/* mobile first — sem breakpoint = mobile */
/* sm: 640px  — celulares grandes / tablets pequenos */
/* md: 768px  — tablets */
/* lg: 1024px — laptops */
/* xl: 1280px — desktops */
```

---

## Error Handling

### Backend

Todos os erros são instâncias de `AppError` (extends `Error`), que carrega:

- `statusCode: number`
- `code: string` (legível por máquina, ex.: `INVALID_CPF`)
- `message: string` (legível por humano, em português)

O middleware global de erros converte instâncias de `AppError` para o envelope padrão de erro.
Erros inesperados são capturados, logados e retornados como `500` sem vazar stack traces em produção.

### Frontend

- Erros de API são capturados em funções de serviço e re-lançados como objetos `ApiError` tipados.
- Componentes nunca chamam a API diretamente; erros sobem via hooks.
- Mensagens de erro voltadas ao usuário são sempre em português brasileiro.
- Erros de validação (CPF, CNPJ) são exibidos inline no campo de input relevante.

---

## Environment & Deployment

### Environment Variables

Sempre use `.env.example` como referência canônica. Nunca commite `.env`.

Variáveis obrigatórias do backend:
```
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=
CORS_ORIGIN=
```

Variáveis obrigatórias do frontend:
```
VITE_API_BASE_URL=
```

### Supabase

O banco de dados é hospedado no **Supabase** (PostgreSQL gerenciado).

- **ORM**: Prisma conectado à connection string do Supabase (`DATABASE_URL` + `DIRECT_URL`).
- **Storage**: Supabase Storage para arquivos e imagens.
- **Row Level Security (RLS)**: Habilitado nas tabelas sensíveis.

#### Connection Pooling (Vercel Serverless)

No Vercel, cada invocação de função pode criar uma nova conexão com o banco. Sem limitar isso, o pool de conexões do Supabase PgBouncer se esgota rapidamente sob carga.

**Duas URLs obrigatórias:**

| Variável | Porta | Quando usar |
|----------|-------|-------------|
| `DATABASE_URL` | 6543 (PgBouncer) | Todas as queries na aplicação serverless |
| `DIRECT_URL` | 5432 (PostgreSQL direto) | Exclusivamente para `prisma migrate` |

**Parâmetros obrigatórios em `DATABASE_URL`:**

```
?pgbouncer=true&connection_limit=1
```

- `pgbouncer=true` — desativa prepared statements (incompatíveis com PgBouncer no modo transaction pooling)
- `connection_limit=1` — limita cada instância serverless a 1 conexão, evitando esgotamento do pool

> **Atenção**: Nunca use `DIRECT_URL` em produção para queries. Ela bypassa o pooler e cria conexões persistentes que não escalam no modelo serverless.

**Buckets de Storage:**

| Bucket | Conteúdo | Acesso |
|--------|----------|--------|
| `pet-images` | Fotos de pets | Público |
| `org-images` | Fotos/logos de organizações | Público |
| `service-images` | Fotos de serviços | Público |
| `exam-files` | Arquivos de exames | Privado |
| `documents` | Documentos gerais | Privado |

Variáveis adicionais obrigatórias do backend:
```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
```

No `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Vercel Configuration

- Backend: `vercel.json` roteia todo `/api/*` para o entry point serverless em `api/index.ts`.
- Frontend: Deploy padrão Vercel React/Vite com `VITE_API_BASE_URL` apontando para o backend.

---

## Git Workflow

### Branches Permanentes

| Branch         | Propósito |
|----------------|-----------|
| `main`         | Código estável, pronto para produção. Nunca commitar diretamente. |
| `homologacao`  | Branch de staging/QA. PRs de tasks vão para cá antes de ir para `main`. |

### Fluxo por Task

```
main
 └── TASK-BE-XXX  →  (develop) → commit → push → PR para homologacao
```

1. Sempre crie o branch a partir de `main` atualizada:
   ```bash
   git checkout main && git pull origin main
   git checkout -b TASK-BE-XXX
   ```
2. Desenvolva seguindo TDD (Red → Green → Refactor).
3. Ao concluir, commite e faça push:
   ```bash
   git add <arquivos>
   git commit -m "feat(module): description"
   git push origin TASK-BE-XXX
   ```
4. Abra PR de `TASK-BE-XXX` → `homologacao`.
5. Após aprovação e merge em `homologacao`, abra PR de `homologacao` → `main` quando o conjunto de features for validado.

### Branch Naming

Branches de task seguem o ID exato da task:

```
TASK-BE-001
TASK-BE-006
TASK-FE-004
```

Para fixes e hotfixes fora do fluxo de tasks:
```
fix/module-name/short-description
hotfix/short-description
```

### Commit Messages (Conventional Commits)

```
type(scope): short description

feat(pet): add co-tutor management
fix(auth): correct JWT expiry calculation
test(person): add CPF edge case coverage
docs(guidelines): add mobile-first breakpoints
chore(deps): update zod to v3.22
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `style`, `perf`

### Pull Request Rules

- PR target: sempre `homologacao` (nunca diretamente `main`).
- Título do PR: `[TASK-BE-XXX] Descrição curta`.
- PRs devem ter descrição com o que foi implementado e como testar.
- Todos os testes devem passar na CI antes do merge.
- Coverage não deve cair abaixo dos thresholds.