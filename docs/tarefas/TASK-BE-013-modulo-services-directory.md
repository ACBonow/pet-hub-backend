# TASK-BE-013 — Módulo Services Directory (Diretório de Serviços)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-013 |
| Módulo       | services-directory |
| Prioridade   | Baixa |
| Dependências | TASK-BE-005, TASK-BE-006 |
| Status       | Pendente |

## Objetivo
Implementar diretório de prestadores de serviços pet (veterinários, clínicas, banho e tosa, hospedaria, transporte, etc.) com listagem pública e gerenciamento autenticado.

## Contexto
- Tipos de serviço: `VETERINARIAN`, `CLINIC`, `EXAM`, `PHARMACY`, `GROOMING`, `BOARDING`, `TRANSPORT`, `OTHER`.
- Listagem é pública para leitura.
- Criação e edição requerem autenticação.
- Um serviço pode estar vinculado a uma Organization.
- Filtros: tipo de serviço, localização, nome.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-005 concluída (modelo ServiceListing)
- [ ] TASK-BE-006 concluída (auth)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/services-directory/__tests__/servicesDirectory.service.test.ts`
  - [ ] Teste: criar serviço com tipo inválido lança `ValidationError`
  - [ ] Teste: criar serviço válido retorna ServiceListing criado
  - [ ] Teste: listar serviços com filtro por tipo retorna resultados paginados
  - [ ] Teste: atualizar serviço
  - [ ] Teste: deletar serviço
- [ ] Criar `src/modules/services-directory/__tests__/servicesDirectory.controller.test.ts`
  - [ ] Teste HTTP: `GET /api/v1/services-directory` → 200 (público)
  - [ ] Teste HTTP: `GET /api/v1/services-directory/:id` → 200 (público)
  - [ ] Teste HTTP: `POST /api/v1/services-directory` → 201 (autenticado)
  - [ ] Teste HTTP: `PATCH /api/v1/services-directory/:id` → 200 (autenticado)
  - [ ] Teste HTTP: `DELETE /api/v1/services-directory/:id` → 204 (autenticado)
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar arquivos do módulo
- [ ] Rotas GET públicas, demais protegidas
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/services-directory/servicesDirectory.types.ts` |
| Criar     | `src/modules/services-directory/servicesDirectory.schema.ts` |
| Criar     | `src/modules/services-directory/servicesDirectory.repository.ts` |
| Criar     | `src/modules/services-directory/servicesDirectory.service.ts` |
| Criar     | `src/modules/services-directory/servicesDirectory.controller.ts` |
| Criar     | `src/modules/services-directory/servicesDirectory.routes.ts` |
| Criar     | `src/modules/services-directory/index.ts` |
| Criar     | `src/modules/services-directory/__tests__/servicesDirectory.service.test.ts` |
| Criar     | `src/modules/services-directory/__tests__/servicesDirectory.controller.test.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] Listagem pública acessível sem autenticação
- [ ] Filtros por `type` e busca por nome funcionam
- [ ] Paginação funcional
- [ ] Tipo `OTHER` aceito para serviços não categorizados
