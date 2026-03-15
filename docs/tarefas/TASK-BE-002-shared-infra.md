# TASK-BE-002 — Infraestrutura Shared (AppError, Logger, Env, Middleware)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-002 |
| Módulo       | shared |
| Prioridade   | Alta |
| Dependências | TASK-BE-001 |
| Status       | Pendente |

## Objetivo
Criar a camada shared com classes de erro padronizadas, logger, configuração de variáveis de ambiente e middlewares globais que serão usados por todos os módulos.

## Contexto
Toda a aplicação depende desta camada. `AppError` é a base de todo tratamento de erro. O logger substitui `console.log` em produção. O `env.ts` garante que variáveis de ambiente obrigatórias estão presentes na inicialização.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-001 concluída

### Red — Testes falhando primeiro
- [ ] Escrever testes para `AppError` em `src/shared/errors/__tests__/AppError.test.ts`
- [ ] Escrever testes para `env.ts` em `src/shared/config/__tests__/env.test.ts`
- [ ] Confirmar que os testes falham

### Green — Implementação mínima
- [ ] Criar `src/shared/errors/AppError.ts` (extends Error com `statusCode` e `code`)
- [ ] Criar `src/shared/errors/HttpError.ts` (factory de erros HTTP comuns)
- [ ] Criar `src/shared/config/env.ts` (valida e exporta variáveis de ambiente com Zod)
- [ ] Criar `src/shared/utils/logger.ts` (wrapper de log estruturado, sem `console.log` direto)
- [ ] Criar `src/shared/middleware/error.middleware.ts` (handler global de erros do Fastify)
- [ ] Criar `src/shared/middleware/auth.middleware.ts` (guard JWT — stub inicial)
- [ ] Criar `src/shared/types/index.ts` (tipos base compartilhados: `PaginationMeta`, `ApiResponse<T>`, `ApiError`)
- [ ] Registrar `error.middleware` no `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Garantir que `AppError` e `HttpError` têm mensagens em português
- [ ] Garantir que o middleware de erro nunca vaza stack trace em produção

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/shared/errors/AppError.ts` |
| Criar     | `src/shared/errors/HttpError.ts` |
| Criar     | `src/shared/errors/__tests__/AppError.test.ts` |
| Criar     | `src/shared/config/env.ts` |
| Criar     | `src/shared/config/__tests__/env.test.ts` |
| Criar     | `src/shared/utils/logger.ts` |
| Criar     | `src/shared/middleware/error.middleware.ts` |
| Criar     | `src/shared/middleware/auth.middleware.ts` |
| Criar     | `src/shared/types/index.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] `AppError` carrega `statusCode`, `code` e `message`
- [ ] Middleware de erro retorna envelope `{ success: false, error: { code, message } }`
- [ ] `env.ts` lança erro na inicialização se variável obrigatória estiver ausente
- [ ] Nenhum `console.log` direto em código de produção
