# TASK-BE-010 — Módulo Adoption (Adoção)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-010 |
| Módulo       | adoption |
| Prioridade   | Média |
| Dependências | TASK-BE-007, TASK-BE-008, TASK-BE-009 |
| Status       | Pendente |

## Objetivo
Implementar listagem e gerenciamento de pets disponíveis para adoção, vinculados a pessoas ou organizações.

## Contexto
- Listagem de adoção é pública (não requer autenticação para leitura).
- Criação e gerenciamento requerem autenticação.
- Um pet em adoção pode ser vinculado a uma Person ou Organization.
- Status: `AVAILABLE`, `RESERVED`, `ADOPTED`.
- Filtros: espécie, porte, localização, organização.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-009 concluída (Pet)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/adoption/__tests__/adoption.service.test.ts`
  - [ ] Teste: criar listagem com pet inexistente lança `NotFoundError`
  - [ ] Teste: criar listagem válida retorna AdoptionListing criada
  - [ ] Teste: listar adoções com filtros retorna resultados paginados
  - [ ] Teste: atualizar status para `ADOPTED` remove da listagem ativa
  - [ ] Teste: deletar listagem
- [ ] Criar `src/modules/adoption/__tests__/adoption.controller.test.ts`
  - [ ] Teste HTTP: `GET /api/v1/adoption` → 200 (público)
  - [ ] Teste HTTP: `GET /api/v1/adoption/:id` → 200 (público)
  - [ ] Teste HTTP: `POST /api/v1/adoption` → 201 (autenticado)
  - [ ] Teste HTTP: `PATCH /api/v1/adoption/:id` → 200 (autenticado)
  - [ ] Teste HTTP: `DELETE /api/v1/adoption/:id` → 204 (autenticado)
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar arquivos do módulo (types, schema, repository, service, controller, routes, index)
- [ ] Rotas GET públicas, demais protegidas por auth middleware
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/adoption/adoption.types.ts` |
| Criar     | `src/modules/adoption/adoption.schema.ts` |
| Criar     | `src/modules/adoption/adoption.repository.ts` |
| Criar     | `src/modules/adoption/adoption.service.ts` |
| Criar     | `src/modules/adoption/adoption.controller.ts` |
| Criar     | `src/modules/adoption/adoption.routes.ts` |
| Criar     | `src/modules/adoption/index.ts` |
| Criar     | `src/modules/adoption/__tests__/adoption.service.test.ts` |
| Criar     | `src/modules/adoption/__tests__/adoption.controller.test.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] Listagem pública acessível sem autenticação
- [ ] Criação requer autenticação
- [ ] Paginação funcional (`page`, `pageSize`, `total` no meta)
- [ ] Filtros por espécie e status funcionam
