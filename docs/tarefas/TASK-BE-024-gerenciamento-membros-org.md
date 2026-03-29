# TASK-BE-024 — Gerenciamento de Membros da Organização

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-024 |
| Módulo       | organization |
| Prioridade   | Alta |
| Dependências | TASK-BE-020 (sistema de papéis) |
| Status       | Pendente |

## Objetivo
Implementar endpoints para o OWNER de uma organização convidar pessoas (por CPF), alterar papéis e remover membros. Garantir as regras de proteção do último OWNER.

## Contexto
Com o sistema de papéis criado na TASK-BE-020, agora precisamos das operações CRUD sobre os membros de uma organização. O convite é feito via **CPF** — o sistema busca a `Person` com aquele CPF e a adiciona à organização.

### Endpoints novos
| Método | Path | Ação |
|--------|------|------|
| `GET` | `/api/v1/organizations/:id/members` | Listar membros com papéis |
| `POST` | `/api/v1/organizations/:id/members` | Adicionar membro por CPF |
| `PATCH` | `/api/v1/organizations/:id/members/:personId` | Alterar papel |
| `DELETE` | `/api/v1/organizations/:id/members/:personId` | Remover membro |

## Checklist

### Pré-requisitos
- [ ] TASK-BE-020 concluída

### Red — Testes falhando primeiro
Arquivo: `src/modules/organization/__tests__/organization.service.test.ts`

- [ ] Teste: `addMember` com CPF válido de Person existente → adiciona com role informado
- [ ] Teste: `addMember` com CPF inexistente → `NotFoundError` com `code: "PERSON_NOT_FOUND"`
- [ ] Teste: `addMember` de Person já membro → `ConflictError` com `code: "ALREADY_A_MEMBER"`
- [ ] Teste: `updateMemberRole` para MANAGER → sucesso
- [ ] Teste: `updateMemberRole` do último OWNER para MANAGER → `BusinessRuleError` com `code: "LAST_OWNER"`
- [ ] Teste: `removeMember` de membro existente → sucesso
- [ ] Teste: `removeMember` do último OWNER → `BusinessRuleError` com `code: "LAST_OWNER"`
- [ ] Confirmar que os testes falham

Arquivo: `src/modules/organization/__tests__/organization.controller.test.ts`

- [ ] Teste HTTP: `GET /organizations/:id/members` por qualquer membro → 200 com lista
- [ ] Teste HTTP: `POST /organizations/:id/members` por OWNER → 201
- [ ] Teste HTTP: `POST /organizations/:id/members` por MANAGER → 403
- [ ] Teste HTTP: `PATCH /organizations/:id/members/:personId` por OWNER → 200
- [ ] Teste HTTP: `DELETE /organizations/:id/members/:personId` por OWNER → 204
- [ ] Confirmar que os testes falham

### Green — Implementação mínima
- [ ] Atualizar `organization.types.ts` com `AddMemberInput { cpf, role }`, `UpdateMemberRoleInput { role }`, `OrganizationMemberView`
- [ ] Atualizar `organization.repository.ts`:
  - `listMembers(orgId)` → `OrganizationMemberView[]`
  - `addMember(orgId, personId, role)` → `OrganizationPerson`
  - `updateMemberRole(orgId, personId, role)` → `OrganizationPerson`
  - `removeMember(orgId, personId)` → void
  - `countOwners(orgId)` → number
- [ ] Atualizar `organization.service.ts` com métodos `addMember`, `updateMemberRole`, `removeMember`, `listMembers`
- [ ] Atualizar `organization.controller.ts` com handlers para os 4 novos endpoints
- [ ] Atualizar `organization.routes.ts` com as rotas (todas protegidas por `authMiddleware`)
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `src/modules/organization/organization.types.ts` |
| Modificar | `src/modules/organization/organization.repository.ts` |
| Modificar | `src/modules/organization/organization.service.ts` |
| Modificar | `src/modules/organization/organization.controller.ts` |
| Modificar | `src/modules/organization/organization.routes.ts` |
| Modificar | `src/modules/organization/organization.schema.ts` |
| Modificar | `src/modules/organization/__tests__/organization.service.test.ts` |
| Modificar | `src/modules/organization/__tests__/organization.controller.test.ts` |

## Critérios de Aceite
- [ ] `GET /organizations/:id/members` retorna lista com `{ personId, name, role }` para qualquer membro
- [ ] `POST /organizations/:id/members` com CPF válido por OWNER → 201, membro adicionado
- [ ] Adicionar CPF inexistente → 404 com `code: "PERSON_NOT_FOUND"`
- [ ] Adicionar CPF de membro já existente → 409 com `code: "ALREADY_A_MEMBER"`
- [ ] Rebaixar/remover último OWNER → 409 com `code: "LAST_OWNER"`
- [ ] Ações de escrita por não-OWNER → 403 com `code: "INSUFFICIENT_PERMISSION"`
