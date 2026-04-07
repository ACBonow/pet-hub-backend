# TASK-BE-032 — Editar relatório de achado/perdido (PATCH /lost-found/:id)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-032 |
| Módulo       | lost-found |
| Prioridade   | Média |
| Dependências | TASK-BE-011 |
| Status       | Pendente |

## Objetivo
Permitir que o criador de um relatório de achado/perdido edite os campos mutáveis após a publicação: descrição, localização, endereço e contato.

## Contexto
O módulo só expõe `PATCH /:id/status`. Erros de endereço ou contato não podem ser corrigidos sem excluir e recriar o relatório — prejudicando quem tenta encontrar o animal.

## Escopo

### Endpoint
`PATCH /api/v1/lost-found/:id`

### Campos editáveis
- `description`
- `location` (campo legado free-text)
- `addressStreet`, `addressNumber`, `addressNeighborhood`
- `addressCep`, `addressCity`, `addressState`, `addressNotes`
- `contactEmail`, `contactPhone`

**Campos NÃO editáveis**: `type`, `petId`, `reporterId`, `status`, `organizationId`.

### Permissões
- Autenticado obrigatório
- Somente o criador pode editar:
  - Verificar que a Person associada ao JWT é o `reporterId`
  - Se `organizationId` presente: verificar OWNER ou MANAGER via `resolveActorContext`
- 403 `INSUFFICIENT_PERMISSION` se não for o criador/responsável

### Schema Zod
Criar `UpdateLostFoundSchema` com todos os campos opcionais (partial).

### Fluxo
`PATCH /:id` → controller valida schema → service busca report → verifica ownership → repository atualiza → retorna `LostFoundReportRecord`

## Arquivos

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `src/modules/lost-found/lost-found.schema.ts` |
| Modificar | `src/modules/lost-found/lost-found.types.ts` |
| Modificar | `src/modules/lost-found/lost-found.repository.ts` |
| Modificar | `src/modules/lost-found/lost-found.service.ts` |
| Modificar | `src/modules/lost-found/lost-found.controller.ts` |
| Modificar | `src/modules/lost-found/lost-found.routes.ts` |
| Modificar | `src/modules/lost-found/__tests__/lostFound.service.test.ts` |
| Modificar | `src/modules/lost-found/__tests__/lostFound.controller.test.ts` |

## Critérios de Aceite
- [ ] `PATCH /api/v1/lost-found/:id` atualiza campos de endereço, descrição e contato
- [ ] 403 se o usuário não for o criador
- [ ] 404 se o relatório não existir
- [ ] Campos não enviados não são alterados (partial update)
- [ ] Testes de service e controller passando
