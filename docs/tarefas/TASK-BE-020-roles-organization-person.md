# TASK-BE-020 — Sistema de Papéis em OrganizationPerson (OWNER/MANAGER/MEMBER)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-020 |
| Módulo       | organization |
| Prioridade   | Alta |
| Dependências | TASK-BE-008 (organization), TASK-BE-019 (registro atômico) |
| Status       | Pendente |

## Objetivo
Adicionar o campo `role` na tabela `OrganizationPerson` com os papéis `OWNER`, `MANAGER` e `MEMBER`. Criar helper de verificação de permissão reutilizável. Garantir que o criador da organização receba `OWNER` automaticamente. Bloquear remoção do último `OWNER`.

## Contexto

### Permissões por papel
| Papel | Editar org | Gerenciar membros | Criar/editar recursos | Criar recursos |
|-------|-----------|-------------------|----------------------|----------------|
| `OWNER` | ✅ | ✅ | ✅ | ✅ |
| `MANAGER` | ❌ | ❌ | ✅ | ✅ |
| `MEMBER` | ❌ | ❌ | ❌ | ✅ |

"Recursos" = pets, adoções, achados/perdidos, serviços criados em nome da organização.

### Enum a criar no schema Prisma
```prisma
enum OrganizationRole {
  OWNER
  MANAGER
  MEMBER
}
```

Campo a adicionar em `OrganizationPerson`:
```prisma
role OrganizationRole @default(MEMBER)
```

## Checklist

### Pré-requisitos
- [ ] TASK-BE-008 concluída

### Schema e Migration
- [ ] Adicionar enum `OrganizationRole` ao `schema.prisma`
- [ ] Adicionar campo `role OrganizationRole @default(MEMBER)` em `OrganizationPerson`
- [ ] Executar `npx prisma migrate dev --name add_org_role`
- [ ] Atualizar `OrganizationPerson` existente: o criador da org deve ter `role = OWNER`

### Red — Testes falhando primeiro
Arquivo: `src/modules/organization/__tests__/organization.service.test.ts`

- [ ] Teste: ao criar organização, o criador recebe `role = OWNER`
- [ ] Teste: adicionar membro sem especificar role → recebe `MEMBER`
- [ ] Teste: tentar remover o último OWNER lança `BusinessRuleError` com `code: "LAST_OWNER"`
- [ ] Teste: tentar rebaixar o último OWNER (de OWNER para MANAGER/MEMBER) lança `BusinessRuleError`
- [ ] Teste: `hasOrgPermission(userId, orgId, 'OWNER')` retorna true para OWNER, false para MANAGER/MEMBER
- [ ] Teste: `hasOrgPermission(userId, orgId, 'MANAGER')` retorna true para OWNER e MANAGER, false para MEMBER
- [ ] Teste: usuário sem vínculo com a org retorna false
- [ ] Confirmar que os testes falham

Arquivo: `src/modules/organization/__tests__/organization.controller.test.ts`

- [ ] Teste HTTP: `POST /api/v1/organizations` → criador tem role OWNER na resposta
- [ ] Teste HTTP: `PATCH /api/v1/organizations/:id` por MEMBER → 403
- [ ] Teste HTTP: `PATCH /api/v1/organizations/:id` por MANAGER → 403
- [ ] Teste HTTP: `PATCH /api/v1/organizations/:id` por OWNER → 200

### Green — Implementação mínima
- [ ] Atualizar `organization.types.ts` com enum `OrganizationRole` e tipo `OrganizationMember`
- [ ] Atualizar `organization.repository.ts`: `createWithOwner`, `updateMemberRole`, `removeMember`, `getOrgRole`
- [ ] Criar `src/shared/utils/org-permission.ts` com função `hasOrgPermission(userId, orgId, minRole)`
- [ ] Atualizar `organization.service.ts`:
  - `create` usa `createWithOwner` passando `role: 'OWNER'` para o criador
  - `update` checa `hasOrgPermission(userId, orgId, 'OWNER')`
  - `delete` checa `hasOrgPermission(userId, orgId, 'OWNER')`
- [ ] Atualizar `organization.controller.ts` para extrair `userId` do JWT e passar ao service
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Exportar `hasOrgPermission` de `shared/` para ser reutilizado por outros módulos (adoption, lost-found, services)

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `prisma/schema.prisma` |
| Criar     | `prisma/migrations/YYYYMMDDHHMMSS_add_org_role/` |
| Modificar | `src/modules/organization/organization.types.ts` |
| Modificar | `src/modules/organization/organization.repository.ts` |
| Modificar | `src/modules/organization/organization.service.ts` |
| Modificar | `src/modules/organization/organization.controller.ts` |
| Criar     | `src/shared/utils/org-permission.ts` |
| Modificar | `src/modules/organization/__tests__/organization.service.test.ts` |
| Modificar | `src/modules/organization/__tests__/organization.controller.test.ts` |

## Critérios de Aceite
- [ ] Criador da organização sempre recebe `role: "OWNER"`
- [ ] PATCH da org por não-OWNER retorna 403 com `code: "INSUFFICIENT_PERMISSION"`
- [ ] Remoção do último OWNER retorna 409 com `code: "LAST_OWNER"`
- [ ] `hasOrgPermission` exportado e testado em isolamento
- [ ] Todos os testes existentes continuam passando
