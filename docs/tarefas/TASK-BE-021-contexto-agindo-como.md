# TASK-BE-021 — Contexto "Agindo Como": aceitar organizationId nos endpoints de criação

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-021 |
| Módulo       | adoption, lost-found, services-directory, pet |
| Prioridade   | Alta |
| Dependências | TASK-BE-020 (sistema de papéis) |
| Status       | Pendente |

## Objetivo
Permitir que endpoints de criação aceitem um `organizationId` opcional. Quando fornecido, o backend valida que o usuário autenticado tem papel `OWNER` ou `MANAGER` nessa organização antes de aceitar a ação. O recurso criado é então associado à organização em vez de à pessoa física.

## Contexto
Hoje todos os recursos (adoções, achados/perdidos, serviços, pets) são criados apenas em nome da pessoa autenticada. Com este contexto, o usuário pode agir em nome de uma organização da qual é responsável.

### Comportamento esperado
```
POST /api/v1/adoptions
Body: { petId, ..., organizationId: "org-uuid" }
→ Valida que o user autenticado tem OWNER ou MANAGER na org
→ AdoptionListing.organizationId = "org-uuid"
→ AdoptionListing.personId = null (ou mantém como criador físico para auditoria — definir)
```

### Módulos afetados
| Módulo | Campo atual de proprietário | Mudança |
|--------|---------------------------|---------|
| `adoption` | `personId` obrigatório | `personId` ou `organizationId` — um deles obrigatório |
| `lost-found` | `reporterId` (Person) | adicionar `organizationId` opcional |
| `services-directory` | `organizationId` já existe, mas sem validação de permissão | validar papel |
| `pet` | tutor derivado do userId | aceitar `tutorOrganizationId` opcional |

## Checklist

### Pré-requisitos
- [ ] TASK-BE-020 concluída (`hasOrgPermission` disponível)

### Schema e Migration (se necessário)
- [ ] Verificar se `AdoptionListing` tem campo `organizationId` nullable — adicionar se não tiver
- [ ] Verificar se `LostFoundReport` tem campo `organizationId` nullable — adicionar se não tiver
- [ ] Executar migration se schema foi alterado

### Red — Testes falhando primeiro

#### adoption
- [ ] Teste: criar adoção com `organizationId` válido e usuário com OWNER → 201, listing.organizationId preenchido
- [ ] Teste: criar adoção com `organizationId` e usuário sem permissão → 403
- [ ] Teste: criar adoção sem `organizationId` → comportamento atual mantido (personId do JWT)

#### lost-found
- [ ] Teste: criar reporte com `organizationId` válido e MANAGER → 201
- [ ] Teste: criar reporte com `organizationId` e MEMBER → 403

#### services-directory
- [ ] Teste: criar serviço com `organizationId` e OWNER → 201
- [ ] Teste: criar serviço com `organizationId` e MEMBER → 403
- [ ] Teste: editar serviço de org sendo MANAGER → 200
- [ ] Teste: editar serviço de org sendo MEMBER → 403

#### pet
- [ ] Teste: criar pet com `tutorOrganizationId` e OWNER → 201, tutorship.organizationId preenchido
- [ ] Teste: criar pet com `tutorOrganizationId` e MEMBER → 403

### Green — Implementação mínima
- [ ] Atualizar schemas Zod de cada módulo para aceitar `organizationId` opcional
- [ ] Atualizar services de cada módulo para chamar `hasOrgPermission` quando `organizationId` presente
- [ ] Atualizar controllers para extrair `organizationId` do body e `userId` do JWT
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Criar função utilitária `resolveActorContext(userId, organizationId?)` em `shared/utils/` que retorna `{ type: 'person' | 'org', personId?, organizationId? }` e já valida a permissão

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `prisma/schema.prisma` (se necessário) |
| Criar     | `src/shared/utils/resolve-actor-context.ts` |
| Modificar | `src/modules/adoption/adoption.schema.ts` |
| Modificar | `src/modules/adoption/adoption.service.ts` |
| Modificar | `src/modules/adoption/adoption.controller.ts` |
| Modificar | `src/modules/lost-found/lost-found.schema.ts` |
| Modificar | `src/modules/lost-found/lost-found.service.ts` |
| Modificar | `src/modules/lost-found/lost-found.controller.ts` |
| Modificar | `src/modules/services-directory/services-directory.service.ts` |
| Modificar | `src/modules/services-directory/services-directory.controller.ts` |
| Modificar | `src/modules/pet/pet.service.ts` |
| Modificar | `src/modules/pet/pet.controller.ts` |

## Critérios de Aceite
- [ ] `organizationId` fornecido + permissão OWNER/MANAGER → recurso criado com org como proprietário
- [ ] `organizationId` fornecido + sem permissão → 403 com `code: "INSUFFICIENT_PERMISSION"`
- [ ] `organizationId` ausente → comportamento atual mantido (pessoa física como proprietária)
- [ ] Todos os testes existentes continuam passando
