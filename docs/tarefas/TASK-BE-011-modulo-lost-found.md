# TASK-BE-011 — Módulo Lost & Found (Achados e Perdidos)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-011 |
| Módulo       | lost-found |
| Prioridade   | Média |
| Dependências | TASK-BE-005, TASK-BE-006 |
| Status       | Pendente |

## Objetivo
Implementar relatórios de animais perdidos e achados, com informações de contato, localização e status de resolução.

## Contexto
- `type`: `LOST` (perdido) ou `FOUND` (achado).
- Pet vinculado é opcional (animal achado pode não ter cadastro).
- Listagem é pública para leitura.
- Status: `OPEN`, `RESOLVED`.
- Informações de contato do reporter são obrigatórias.
- Foto do animal pode ser anexada (Supabase Storage, bucket `documents`).

## Checklist

### Pré-requisitos
- [ ] TASK-BE-005 concluída (modelo LostFoundReport)
- [ ] TASK-BE-006 concluída (auth)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/lost-found/__tests__/lostFound.service.test.ts`
  - [ ] Teste: criar relatório sem informações de contato lança `ValidationError`
  - [ ] Teste: criar relatório `LOST` válido retorna relatório criado
  - [ ] Teste: criar relatório `FOUND` sem pet vinculado → sucesso
  - [ ] Teste: marcar relatório como `RESOLVED`
  - [ ] Teste: listar relatórios com filtro por tipo e status
- [ ] Criar `src/modules/lost-found/__tests__/lostFound.controller.test.ts`
  - [ ] Teste HTTP: `GET /api/v1/lost-found` → 200 (público)
  - [ ] Teste HTTP: `POST /api/v1/lost-found` → 201 (autenticado)
  - [ ] Teste HTTP: `PATCH /api/v1/lost-found/:id` → 200 (autenticado)
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar arquivos do módulo
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/lost-found/lostFound.types.ts` |
| Criar     | `src/modules/lost-found/lostFound.schema.ts` |
| Criar     | `src/modules/lost-found/lostFound.repository.ts` |
| Criar     | `src/modules/lost-found/lostFound.service.ts` |
| Criar     | `src/modules/lost-found/lostFound.controller.ts` |
| Criar     | `src/modules/lost-found/lostFound.routes.ts` |
| Criar     | `src/modules/lost-found/index.ts` |
| Criar     | `src/modules/lost-found/__tests__/lostFound.service.test.ts` |
| Criar     | `src/modules/lost-found/__tests__/lostFound.controller.test.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] Relatório criado sem pet vinculado (animal achado sem cadastro) → sucesso
- [ ] Listagem pública com filtros por `type` e `status`
- [ ] Status `RESOLVED` fecha o relatório
