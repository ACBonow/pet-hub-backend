# TASK-BE-026 — Serviço por Organização: validação de permissão

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-026 |
| Módulo       | services-directory |
| Prioridade   | Média |
| Dependências | TASK-BE-021 (contexto "agindo como") |
| Status       | Pendente |

## Objetivo
O model `ServiceListing` já possui `organizationId` opcional, mas não há validação de que o usuário que está criando/editando o serviço tem permissão sobre aquela organização. Esta task adiciona essa validação e garante que edição/remoção também seja controlada por papel.

## Contexto
Atualmente qualquer usuário autenticado pode passar qualquer `organizationId` ao criar um serviço. Com esta task:
- Criação com `organizationId` → valida OWNER ou MANAGER
- Edição/deleção de serviço de org → valida OWNER ou MANAGER da org
- Edição/deleção de serviço pessoal → valida que é o criador (`createdByUserId`)

### Campo `createdByUserId`
`ServiceListing` precisa de um campo `createdByUserId String` (obrigatório, preenchido com `userId` do JWT) para identificar o criador em serviços pessoais. Verificar se já existe — adicionar via migration se não existir.

## Checklist

### Schema e Migration
- [ ] Verificar se `ServiceListing` tem `createdByUserId` — adicionar se não tiver
- [ ] Executar migration se necessário

### Red — Testes falhando primeiro
Arquivo: `src/modules/services-directory/__tests__/services-directory.service.test.ts`

- [ ] Teste: criar serviço com `organizationId` e OWNER → sucesso
- [ ] Teste: criar serviço com `organizationId` e MEMBER → erro de permissão
- [ ] Teste: editar serviço pessoal como criador → sucesso
- [ ] Teste: editar serviço pessoal como outro usuário → 403
- [ ] Teste: editar serviço de org como MANAGER → sucesso
- [ ] Teste: editar serviço de org como MEMBER → 403
- [ ] Teste: deletar serviço de org como não-OWNER → 403
- [ ] Confirmar que os testes falham

### Green — Implementação mínima
- [ ] Atualizar `services-directory.service.ts`:
  - `create`: chamar `resolveActorContext` quando `organizationId` presente
  - `update`: verificar se é criador (pessoal) ou OWNER/MANAGER (org)
  - `delete`: verificar se é criador (pessoal) ou OWNER (org)
- [ ] Atualizar `services-directory.repository.ts` para salvar e filtrar por `createdByUserId`
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `prisma/schema.prisma` (se necessário) |
| Modificar | `src/modules/services-directory/services-directory.types.ts` |
| Modificar | `src/modules/services-directory/services-directory.repository.ts` |
| Modificar | `src/modules/services-directory/services-directory.service.ts` |
| Modificar | `src/modules/services-directory/services-directory.controller.ts` |
| Modificar | `src/modules/services-directory/__tests__/services-directory.service.test.ts` |
| Modificar | `src/modules/services-directory/__tests__/services-directory.controller.test.ts` |

## Critérios de Aceite
- [ ] Criar serviço de org sem permissão OWNER/MANAGER → 403
- [ ] Editar/deletar serviço pessoal por outro usuário → 403
- [ ] Editar serviço de org por MANAGER → 200
- [ ] Deletar serviço de org por não-OWNER → 403
- [ ] Todos os testes existentes continuam passando
