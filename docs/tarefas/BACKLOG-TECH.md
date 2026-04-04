# BACKLOG TÉCNICO — Backend

Tarefas de segurança, SOLID, performance e qualidade identificadas em revisão técnica.  
Não são features de produto — são melhorias de engenharia.

> **Convenção de ID**: `TECH-BE-XXX`  
> **Status possíveis**: `Pendente` · `Em andamento` · `Concluída` · `Cancelada`

---

## Índice

- [Segurança](#segurança)
- [SOLID / Design Patterns](#solid--design-patterns)
- [Performance](#performance)
- [Qualidade](#qualidade)

---

## Segurança

### TECH-BE-001 — Corrigir CORS padrão: lançar erro se `CORS_ORIGIN` não estiver definido

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-001 |
| Categoria    | Segurança |
| Prioridade   | **Crítica** |
| Status       | Concluída |

**Problema**  
Em `src/app.ts`, o CORS está configurado como `origin: process.env.CORS_ORIGIN ?? '*'`. Se a variável não estiver definida em produção, qualquer origem será aceita.

**Fix**  
Adicionar `CORS_ORIGIN` como variável obrigatória em `src/shared/config/env.ts` (junto com `DATABASE_URL`, `JWT_SECRET`, etc.). A ausência deve lançar erro na inicialização, impedindo o servidor de subir sem configuração válida.

**Arquivos**
- `src/app.ts`
- `src/shared/config/env.ts`

---

### TECH-BE-002 — Adicionar verificação de permissão nos endpoints update/delete de Organization

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-002 |
| Categoria    | Segurança |
| Prioridade   | **Crítica** |
| Status       | Concluída |

**Problema**  
`PATCH /organizations/:id` e `DELETE /organizations/:id` não chamam `resolveActorContext`. Qualquer usuário autenticado pode editar ou apagar qualquer organização.

**Fix**  
Chamar `resolveActorContext(request.user.id, request.params.id)` no início dos handlers de update e delete, assim como já é feito em outros endpoints da org (upload de foto, gerência de membros).

**Arquivos**
- `src/modules/organization/organization.controller.ts`

---

### TECH-BE-003 — Validar ownership antes de update/delete em Pet e AdoptionListing

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-003 |
| Categoria    | Segurança |
| Prioridade   | **Crítica** |
| Status       | Concluída |

**Problema**  
Qualquer usuário autenticado pode deletar ou editar pets e anúncios de adoção que não são seus. Não há verificação de que o requester é o tutor primário ou criador do recurso.

**Fix**  
No controller, antes de chamar o service, buscar o recurso e comparar `createdByUserId` / `tutorUserId` com `request.user.id`. Retornar `403 INSUFFICIENT_PERMISSION` se não for o dono.

**Arquivos**
- `src/modules/pet/pet.controller.ts`
- `src/modules/adoption/adoption.controller.ts`
- `src/modules/lost-found/lost-found.controller.ts`

---

### TECH-BE-004 — Adicionar rate limiting nos endpoints de autenticação

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-004 |
| Categoria    | Segurança |
| Prioridade   | Alta |
| Status       | Concluída |
| Dependências | Instalar `@fastify/rate-limit` |

**Problema**  
Os endpoints de login, registro, refresh e reset de senha não têm rate limiting, expondo-os a força bruta e abuso de envio de emails.

**Fix**  
Instalar `@fastify/rate-limit` e registrar limites diferenciados:
- `POST /auth/login` → 10 req/min por IP
- `POST /auth/register` → 5 req/min por IP
- `POST /auth/forgot-password` → 3 req/min por IP
- `POST /auth/refresh` → 30 req/min por IP

**Arquivos**
- `src/app.ts` (ou plugin dedicado `src/shared/plugins/rate-limit.ts`)

---

### TECH-BE-005 — Validar magic bytes em uploads (não apenas MIME type)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-005 |
| Categoria    | Segurança |
| Prioridade   | Alta |
| Status       | Concluída |
| Dependências | Avaliar pacote `file-type` |

**Problema**  
A validação atual verifica apenas o `Content-Type` informado pelo cliente, que pode ser falsificado (ex: enviar um `.exe` com `image/jpeg`).

**Fix**  
Ler os primeiros bytes do buffer e verificar a assinatura:
- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47`
- WebP: `52 49 46 46 ... 57 45 42 50`

**Arquivos**
- `src/modules/pet/pet.controller.ts`
- `src/modules/organization/organization.controller.ts`
- `src/modules/services-directory/services-directory.controller.ts`
- `src/modules/pet-health/pet-health.controller.ts`

---

### TECH-BE-006 — Adicionar `maxLength` em todos os schemas Zod

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-006 |
| Categoria    | Segurança |
| Prioridade   | Alta |
| Status       | Pendente |

**Problema**  
Campos de texto como `name`, `description`, `notes`, `email`, `address` não têm limite máximo. Payloads gigantes sobrecarregam o banco e o servidor (vetor de DoS).

**Fix**  
Adicionar `.max(N)` em cada campo string de todos os schemas:
- `name` → max 100
- `description` / `notes` → max 2000
- `email` → max 254 (RFC 5321)
- `phone` → max 20
- `address` → max 300

**Arquivos**  
Todos os `*.schema.ts` — auth, person, organization, pet, adoption, lost-found, services-directory.

---

### TECH-BE-007 — Especificar algoritmo JWT explicitamente (`HS256`)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-007 |
| Categoria    | Segurança |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
`jwt.sign()` usa o algoritmo padrão implicitamente. Se manipulado via env, poderia aceitar `none` ou outro algoritmo fraco.

**Fix**  
Passar `{ algorithm: 'HS256' }` explicitamente em todos os `jwt.sign()` e `jwt.verify()`.

**Arquivos**
- `src/modules/auth/auth.service.ts`

---

### TECH-BE-008 — Adicionar audit log para mutações em Organization

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-008 |
| Categoria    | Segurança |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
Não há rastreabilidade de quem adicionou/removeu membros, mudou roles ou editou dados da organização.

**Fix (curto prazo)**  
Logar em structured log (pino) com campos `{ orgId, actorUserId, action, payload }` em cada operação sensível de org.

**Fix (longo prazo)**  
Criar tabela `OrganizationAuditLog` no Prisma com `(orgId, actorUserId, action, payload JSON, createdAt)`.

**Arquivos**
- `src/modules/organization/organization.service.ts`
- `prisma/schema.prisma` (se optar pela tabela)

---

## SOLID / Design Patterns

### TECH-BE-009 — Criar interface `IFileStorage` e injetar nos services (DIP)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-009 |
| Categoria    | SOLID |
| Prioridade   | Alta |
| Status       | Pendente |

**Problema**  
A lógica de upload está duplicada em `pet.service.ts`, `organization.service.ts`, `services-directory.service.ts` e `pet-health.service.ts`. Todos chamam `storage.ts` (Supabase) diretamente, violando DIP e impossibilitando mock em testes.

**Fix**
1. Criar `src/shared/storage/IFileStorage.ts` com interface `{ upload(bucket, path, buffer, mime): Promise<string>; delete(bucket, path): Promise<void> }`
2. Criar `SupabaseFileStorage implements IFileStorage`
3. Injetar `IFileStorage` nos services via constructor
4. Remover imports diretos de `storage.ts` dos services

**Arquivos**
- `src/shared/storage/IFileStorage.ts` (novo)
- `src/shared/storage/SupabaseFileStorage.ts` (novo)
- `src/modules/pet/pet.service.ts`
- `src/modules/organization/organization.service.ts`
- `src/modules/services-directory/services-directory.service.ts`
- `src/modules/pet-health/pet-health.service.ts`

---

### TECH-BE-010 — Padronizar paginação com tipo `PaginatedResult<T>` (DRY)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-010 |
| Categoria    | SOLID |
| Prioridade   | Alta |
| Status       | Pendente |

**Problema**  
Cada módulo implementa paginação de forma diferente. O envelope de resposta é inconsistente entre os endpoints de listagem.

**Fix**
1. Criar `src/shared/types/pagination.ts` com `PaginatedResult<T>`, `PaginationParams`
2. Criar helper `buildPaginationMeta(total, page, limit)`
3. Migrar todos os `findAll()` dos repositories para usar o tipo compartilhado
4. Garantir envelope consistente: `{ data, meta: { page, limit, total, totalPages } }`

**Arquivos**
- `src/shared/types/pagination.ts` (novo)
- Todos os repositories com `findAll`

---

### TECH-BE-011 — Extrair mappers de Prisma para camada dedicada (SRP)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-011 |
| Categoria    | SOLID |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
Funções como `mapPet`, `mapTutorship` em `pet.repository.ts` usam `any` como tipo e misturam responsabilidade de acesso a dados com transformação, violando SRP e degradando type safety.

**Fix**
1. Criar `pet.mapper.ts`, `organization.mapper.ts`, etc. em cada módulo
2. Tipar com `Prisma.PetGetPayload<...>` (tipos gerados pelo Prisma)
3. Repository retorna tipos Prisma; mapper converte para domain types
4. Remover `function mapX(x: any)` dos repositories

**Arquivos**
- `src/modules/pet/pet.mapper.ts` (novo)
- `src/modules/pet/pet.repository.ts`
- Demais repositories com funções de mapeamento

---

### TECH-BE-012 — Usar `hasOrgPermission` consistentemente (remover inline role checks)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-012 |
| Categoria    | SOLID |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
`organization.service.ts` verifica permissão inline com `if (requesterRole !== 'OWNER')` em vez de usar o utilitário `hasOrgPermission` já existente, criando inconsistência com o padrão definido no CLAUDE.md.

**Fix**  
Substituir todas as verificações inline de role por chamadas a `hasOrgPermission(role, requiredRole)`.

**Arquivos**
- `src/modules/organization/organization.service.ts`

---

### TECH-BE-013 — Remover método `@deprecated createUser` de auth.repository

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-013 |
| Categoria    | SOLID |
| Prioridade   | Baixa |
| Status       | Pendente |

**Problema**  
O método `createUser` está marcado como `@deprecated` mas ainda existe, aumentando a superfície de manutenção e podendo confundir futuros desenvolvedores.

**Fix**  
Remover o método e sua declaração na interface. Verificar que nenhum teste o referencia diretamente.

**Arquivos**
- `src/modules/auth/auth.repository.ts`

---

### TECH-BE-014 — Adicionar soft delete (`deletedAt`) nos modelos sensíveis

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-014 |
| Categoria    | SOLID |
| Prioridade   | Alta |
| Status       | Pendente |

**Problema**  
Todos os deletes são permanentes. Perda de dados irreversível em `AdoptionListing`, `LostFoundReport`, `Pet`, `ServiceListing`.

**Fix**
1. Adicionar campo `deletedAt DateTime?` nos modelos citados em `schema.prisma`
2. Criar migration
3. Substituir `prisma.X.delete()` por `update({ data: { deletedAt: new Date() } })`
4. Adicionar `where: { deletedAt: null }` em todos os `findAll` e `findById`
5. Adicionar index em `deletedAt`

**Arquivos**
- `prisma/schema.prisma`
- Repositories de adoption, lost-found, pet, services-directory

---

## Performance

### TECH-BE-015 — Adicionar índice composto `(status, createdAt)` em AdoptionListing e LostFoundReport

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-015 |
| Categoria    | Performance |
| Prioridade   | Alta |
| Status       | Pendente |

**Problema**  
As listagens filtram por `status` e ordenam por `createdAt`. Sem índice composto, o PostgreSQL faz scan + sort — ineficiente com dados crescentes.

**Fix**  
Adicionar no `schema.prisma`:
```prisma
@@index([status, createdAt(sort: Desc)])
```
em `AdoptionListing` e `LostFoundReport`. Criar migration.

**Arquivos**
- `prisma/schema.prisma`

---

### TECH-BE-016 — Implementar cache de role de organização para evitar query por requisição

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-016 |
| Categoria    | Performance |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
`resolveActorContext` consulta o banco a cada requisição autenticada em rotas de org, gerando queries repetidas.

**Fix (curto prazo)**  
Cache em memória com `Map<string, { role, expiresAt }>` e TTL de 30s.

**Fix (longo prazo)**  
Incluir `orgRoles: { orgId, role }[]` no payload do JWT access token, eliminando queries de role por completo. Invalidar via refresh token.

**Arquivos**
- `src/shared/utils/resolve-actor-context.ts`
- `src/shared/utils/org-permission.ts`

---

### TECH-BE-017 — Paginar histórico de tutoria (`getTutorshipHistory`)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-017 |
| Categoria    | Performance |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
O endpoint de histórico carrega todos os registros sem limite. Pets com muitas transferências causarão respostas pesadas.

**Fix**  
Adicionar `limit` e `cursor` (ou `page`) no repository e expor via query params no controller.

**Arquivos**
- `src/modules/pet/pet.repository.ts`
- `src/modules/pet/pet.controller.ts`

---

### TECH-BE-018 — Tornar carregamento de co-tutores lazy (não incluir em listagens)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-018 |
| Categoria    | Performance |
| Prioridade   | Baixa |
| Status       | Pendente |

**Problema**  
O include de `coTutors` está em todas as queries de Pet, mesmo em listagens e pickers onde não são necessários.

**Fix**  
Remover `coTutors` do include padrão. Criar variante `petDetailInclude` com co-tutores para uso apenas no `findById`.

**Arquivos**
- `src/modules/pet/pet.repository.ts`

---

### TECH-BE-019 — Documentar e configurar pool de conexões para Vercel serverless

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-019 |
| Categoria    | Performance |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
Em Vercel, cada função pode criar novas conexões. Sem `connection_limit=1` no `DATABASE_URL`, as conexões com o Supabase PgBouncer podem se esgotar sob carga.

**Fix**
1. Verificar e documentar `?pgbouncer=true&connection_limit=1` no `.env.example`
2. Documentar no `GUIDELINES.md` a diferença entre `DATABASE_URL` (pooler, serverless) e `DIRECT_URL` (migrations)

**Arquivos**
- `.env.example`
- `GUIDELINES.md`

---

## Qualidade

### TECH-BE-020 — Logar erros de deleção de arquivo no storage (remover `.catch(() => {})`)

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-020 |
| Categoria    | Qualidade |
| Prioridade   | Alta |
| Status       | Pendente |

**Problema**  
A deleção do arquivo antigo no Supabase Storage usa `.catch(() => {})`, engolindo silenciosamente falhas. Arquivos órfãos se acumulam sem que ninguém saiba.

**Fix**  
Substituir por `.catch((err) => logger.warn('storage.delete.failed', { err, bucket, path }))`.

**Arquivos**
- `src/modules/pet/pet.service.ts`
- `src/modules/organization/organization.service.ts`
- `src/modules/services-directory/services-directory.service.ts`

---

### TECH-BE-021 — Adicionar thresholds de cobertura de testes no `jest.config.ts`

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-021 |
| Categoria    | Qualidade |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
Não há limites mínimos de cobertura. É possível adicionar código sem testes e o CI não falha.

**Fix**  
Adicionar em `jest.config.ts`:
```ts
coverageThreshold: {
  global: { branches: 70, functions: 80, lines: 80, statements: 80 },
},
collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/__tests__/**'],
```

**Arquivos**
- `jest.config.ts`

---

### TECH-BE-022 — Padronizar códigos de status HTTP nas respostas dos controllers

| Campo        | Valor |
|--------------|-------|
| ID           | TECH-BE-022 |
| Categoria    | Qualidade |
| Prioridade   | Média |
| Status       | Pendente |

**Problema**  
Alguns controllers retornam `200` onde deveriam retornar `201` (POST de criação) ou `204` (DELETE sem body).

**Fix**  
Revisar todos os controllers:
- `POST` que cria recurso → `201 Created`
- `GET` → `200 OK`
- `PATCH` / `PUT` → `200 OK` com body atualizado
- `DELETE` → `204 No Content` (sem body)

**Arquivos**  
Todos os `*.controller.ts`.
