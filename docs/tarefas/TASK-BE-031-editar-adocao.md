# TASK-BE-031 — Editar anúncio de adoção (PATCH /adoptions/:id)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-031 |
| Módulo       | adoption |
| Prioridade   | Média |
| Dependências | TASK-BE-010 |
| Status       | Pendente |

## Objetivo
Permitir que o criador de um anúncio de adoção edite os campos mutáveis após a publicação: descrição e informações de contato.

## Contexto
Atualmente o módulo de adoção só expõe `PATCH /:id/status`. Não existe endpoint de edição completa. O usuário que comete um erro na descrição ou muda o contato não tem como corrigir sem excluir e recriar o anúncio.

## Escopo

### Endpoint
`PATCH /api/v1/adoptions/:id`

### Campos editáveis
- `description` — opcional, string|null
- `contactEmail` — opcional, string|null
- `contactPhone` — opcional, string|null
- `contactWhatsapp` — opcional, string|null

**Campos NÃO editáveis**: `petId`, `status`, `listerType`, `personId`, `organizationId`.

### Permissões
- Autenticado obrigatório
- Somente o criador pode editar:
  - Se `listerType === 'PERSON'`: verificar que a pessoa do JWT é a donatária (`personId`)
  - Se `listerType === 'ORGANIZATION'`: verificar que o usuário é OWNER ou MANAGER via `resolveActorContext`
- 403 `INSUFFICIENT_PERMISSION` se não for o criador/responsável

### Schema Zod
Criar `UpdateAdoptionSchema` com todos os campos opcionais (partial).

### Fluxo
`PATCH /:id` → controller valida schema → service busca listing → verifica ownership → repository atualiza → retorna `AdoptionListingRecord`

## Arquivos

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `src/modules/adoption/adoption.schema.ts` |
| Modificar | `src/modules/adoption/adoption.types.ts` |
| Modificar | `src/modules/adoption/adoption.repository.ts` |
| Modificar | `src/modules/adoption/adoption.service.ts` |
| Modificar | `src/modules/adoption/adoption.controller.ts` |
| Modificar | `src/modules/adoption/adoption.routes.ts` |
| Modificar | `src/modules/adoption/__tests__/adoption.service.test.ts` |
| Modificar | `src/modules/adoption/__tests__/adoption.controller.test.ts` |

## Critérios de Aceite
- [ ] `PATCH /api/v1/adoptions/:id` atualiza description e contato
- [ ] 403 se o usuário não for o criador
- [ ] 404 se o anúncio não existir
- [ ] Campos não enviados não são alterados (partial update)
- [ ] Testes de service e controller passando
