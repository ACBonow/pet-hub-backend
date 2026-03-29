# TASK-BE-025 — Lost & Found por Organização

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-025 |
| Módulo       | lost-found |
| Prioridade   | Média |
| Dependências | TASK-BE-021 (contexto "agindo como") |
| Status       | Pendente |

## Objetivo
Permitir que um reporte de achado/perdido seja criado em nome de uma organização. Atualmente `reporterId` aponta obrigatoriamente para uma `Person`; esta task torna o campo de proprietário polimórfico (pessoa OU organização).

## Contexto
ONGs de resgate frequentemente registram animais achados em nome da organização, não de uma pessoa específica. A entidade criadora deve ser identificável no card (ver TASK-FE-034).

### Estratégia de schema
Manter `reporterId` (Person) e adicionar `organizationId` (Organization) como campos opcionais mutuamente exclusivos — validação no service:
- Se `organizationId` presente → valida permissão OWNER/MANAGER → define `organizationId`, `reporterId` fica null ou mantém userId como auditoria
- Se `organizationId` ausente → `reporterId` = personId do usuário autenticado (comportamento atual)

## Checklist

### Schema e Migration
- [ ] Verificar se `LostFoundReport` já tem `organizationId` nullable — adicionar se não tiver
- [ ] Executar `npx prisma migrate dev --name add_lost_found_org`

### Red — Testes falhando primeiro
Arquivo: `src/modules/lost-found/__tests__/lost-found.service.test.ts`

- [ ] Teste: criar reporte sem `organizationId` → `reporterId` = personId do user (comportamento atual mantido)
- [ ] Teste: criar reporte com `organizationId` válido e OWNER → `organizationId` salvo, sucesso
- [ ] Teste: criar reporte com `organizationId` e MEMBER → 403
- [ ] Teste: criar reporte com `organizationId` inexistente → 404

Arquivo: `src/modules/lost-found/__tests__/lost-found.controller.test.ts`

- [ ] Teste HTTP: `POST /api/v1/lost-found` com `organizationId` e MANAGER → 201
- [ ] Teste HTTP: listagem inclui campo `organization` (nome + foto) quando criado por org

### Green — Implementação mínima
- [ ] Atualizar `lost-found.schema.ts` para aceitar `organizationId` opcional
- [ ] Atualizar `lost-found.service.ts` para chamar `resolveActorContext` (de TASK-BE-021)
- [ ] Atualizar `lost-found.repository.ts` para salvar `organizationId`
- [ ] Atualizar query de listagem para incluir dados da organização (join)
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `prisma/schema.prisma` (se necessário) |
| Modificar | `src/modules/lost-found/lost-found.types.ts` |
| Modificar | `src/modules/lost-found/lost-found.schema.ts` |
| Modificar | `src/modules/lost-found/lost-found.repository.ts` |
| Modificar | `src/modules/lost-found/lost-found.service.ts` |
| Modificar | `src/modules/lost-found/lost-found.controller.ts` |
| Modificar | `src/modules/lost-found/__tests__/lost-found.service.test.ts` |
| Modificar | `src/modules/lost-found/__tests__/lost-found.controller.test.ts` |

## Critérios de Aceite
- [ ] Reporte sem `organizationId` → comportamento atual (pessoa física) mantido
- [ ] Reporte com `organizationId` por OWNER/MANAGER → 201 com `organizationId` salvo
- [ ] Reporte com `organizationId` por MEMBER → 403
- [ ] Listagem retorna nome da organização quando o reporte foi criado por org
