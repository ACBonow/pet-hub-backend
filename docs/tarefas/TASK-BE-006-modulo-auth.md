# TASK-BE-006 — Módulo Auth

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-006 |
| Módulo       | auth |
| Prioridade   | Alta |
| Dependências | TASK-BE-002, TASK-BE-005 |
| Status       | Pendente |

## Objetivo
Implementar autenticação JWT própria com registro, login, logout e refresh de token.

## Contexto
- Supabase Auth **não é utilizado**.
- Access token: JWT de curta duração (15 min).
- Refresh token: JWT de longa duração (7 dias), armazenado no banco (modelo `User.refreshToken`).
- Senhas: sempre hashadas com bcrypt (nunca armazenadas em texto puro).
- Logout invalida o refresh token no banco.
- O `auth.middleware.ts` (criado na TASK-BE-002) é completado aqui.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-002 concluída (AppError, env, middleware stub)
- [ ] TASK-BE-005 concluída (modelo User no banco)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/auth/__tests__/auth.service.test.ts`
  - [ ] Teste: `register` com email já existente lança `ConflictError`
  - [ ] Teste: `register` válido cria User com senha hashada
  - [ ] Teste: `login` com senha errada lança `UnauthorizedError`
  - [ ] Teste: `login` válido retorna `accessToken` e `refreshToken`
  - [ ] Teste: `refreshToken` inválido lança `UnauthorizedError`
  - [ ] Teste: `refreshToken` válido retorna novo `accessToken`
  - [ ] Teste: `logout` invalida o refresh token no banco
- [ ] Criar `src/modules/auth/__tests__/auth.controller.test.ts`
  - [ ] Teste HTTP: `POST /api/v1/auth/register` → 201
  - [ ] Teste HTTP: `POST /api/v1/auth/login` → 200 com tokens
  - [ ] Teste HTTP: `POST /api/v1/auth/refresh` → 200 com novo access token
  - [ ] Teste HTTP: `POST /api/v1/auth/logout` → 204
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar `src/modules/auth/auth.types.ts`
- [ ] Criar `src/modules/auth/auth.schema.ts` (schemas Zod para register e login)
- [ ] Criar `src/modules/auth/auth.repository.ts` (interface + implementação Prisma)
- [ ] Criar `src/modules/auth/auth.service.ts`
- [ ] Criar `src/modules/auth/auth.controller.ts`
- [ ] Criar `src/modules/auth/auth.routes.ts`
- [ ] Criar `src/modules/auth/index.ts`
- [ ] Completar `src/shared/middleware/auth.middleware.ts` (verificar JWT do header Authorization)
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Extrair helper `generateTokens(userId)` para reutilização futura
- [ ] Garantir que tokens não são logados

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/auth/auth.types.ts` |
| Criar     | `src/modules/auth/auth.schema.ts` |
| Criar     | `src/modules/auth/auth.repository.ts` |
| Criar     | `src/modules/auth/auth.service.ts` |
| Criar     | `src/modules/auth/auth.controller.ts` |
| Criar     | `src/modules/auth/auth.routes.ts` |
| Criar     | `src/modules/auth/index.ts` |
| Criar     | `src/modules/auth/__tests__/auth.service.test.ts` |
| Criar     | `src/modules/auth/__tests__/auth.controller.test.ts` |
| Modificar | `src/shared/middleware/auth.middleware.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] `POST /api/v1/auth/register` cria usuário e retorna tokens
- [ ] `POST /api/v1/auth/login` autentica e retorna tokens
- [ ] `POST /api/v1/auth/refresh` renova access token com refresh token válido
- [ ] `POST /api/v1/auth/logout` invalida refresh token no banco
- [ ] Senhas nunca armazenadas em texto puro
- [ ] Rotas protegidas retornam 401 sem token válido
