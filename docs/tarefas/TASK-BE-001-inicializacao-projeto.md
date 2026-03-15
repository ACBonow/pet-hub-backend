# TASK-BE-001 — Inicialização do Projeto Backend

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-001 |
| Módulo       | infra |
| Prioridade   | Alta |
| Dependências | Nenhuma |
| Status       | Pendente |

## Objetivo
Inicializar o projeto Node.js com TypeScript, configurar Jest, Fastify, Prisma e Vercel para o ambiente de desenvolvimento.

## Contexto
Este é o ponto de partida de todo o backend. Nenhum módulo pode ser iniciado antes desta tarefa estar concluída. O projeto roda como função serverless na Vercel, então o entry point principal é `api/index.ts`.

## Checklist

### Pré-requisitos
- [ ] Node.js instalado (versão LTS)
- [ ] Conta Vercel configurada
- [ ] Projeto Supabase criado (obter `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`)

### Red — Testes falhando primeiro
- [ ] Escrever um teste de smoke em `src/__tests__/app.test.ts` que verifica se a aplicação inicializa sem erros
- [ ] Confirmar que o teste falha (app ainda não existe)

### Green — Implementação mínima
- [ ] `npm init -y`
- [ ] Instalar dependências de produção: `fastify`, `@fastify/cors`, `@fastify/helmet`, `@prisma/client`, `zod`, `jsonwebtoken`, `bcrypt`
- [ ] Instalar dependências de dev: `typescript`, `ts-node`, `tsx`, `@types/node`, `@types/jsonwebtoken`, `@types/bcrypt`, `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`, `prisma`
- [ ] Criar `tsconfig.json` com `strict: true`
- [ ] Criar `jest.config.ts`
- [ ] Criar `src/app.ts` com instância básica do Fastify
- [ ] Criar `src/server.ts` para execução local
- [ ] Criar `api/index.ts` como entry point serverless da Vercel
- [ ] Criar `vercel.json` roteando `/api/*` para `api/index.ts`
- [ ] Criar `.env.example` com todas as variáveis necessárias
- [ ] Criar `.gitignore`
- [ ] Confirmar que o teste de smoke passa

### Refactor
- [ ] Verificar se `tsconfig.json` está com paths corretos para os módulos
- [ ] Garantir que scripts do `package.json` cobrem `dev`, `build`, `test`, `test:coverage`

### Finalização
- [ ] Todos os testes passando
- [ ] `npm run build` sem erros
- [ ] `.env.example` com todas as variáveis documentadas
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação   | Arquivo |
|--------|---------|
| Criar  | `package.json` |
| Criar  | `tsconfig.json` |
| Criar  | `jest.config.ts` |
| Criar  | `src/app.ts` |
| Criar  | `src/server.ts` |
| Criar  | `api/index.ts` |
| Criar  | `vercel.json` |
| Criar  | `.env.example` |
| Criar  | `.gitignore` |
| Criar  | `src/__tests__/app.test.ts` |

## Critérios de Aceite
- [ ] `npm test` executa e passa
- [ ] `npm run dev` sobe o servidor local sem erros
- [ ] `npm run build` compila sem erros TypeScript
- [ ] Todas as variáveis de ambiente estão documentadas em `.env.example`
- [ ] `vercel.json` está configurado corretamente para serverless
