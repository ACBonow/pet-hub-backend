# TASK-BE-007 — Módulo Person

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-007 |
| Módulo       | person |
| Prioridade   | Alta |
| Dependências | TASK-BE-003, TASK-BE-005, TASK-BE-006 |
| Status       | Pendente |

## Objetivo
Implementar CRUD de pessoas físicas com validação de CPF, vinculação com User de autenticação e gerenciamento de perfil.

## Contexto
- CPF é obrigatório, único no banco e validado pelo algoritmo de dígito verificador.
- CPF é armazenado como string de 11 dígitos sem formatação.
- Uma Person está vinculada a um User (autenticação).
- Uma Person pode ser responsável por uma ou mais Organizations.
- A rota de criação de Person é chamada após o registro no Auth.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-003 concluída (validator CPF)
- [ ] TASK-BE-005 concluída (modelo Person no banco)
- [ ] TASK-BE-006 concluída (auth middleware funcional)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/person/__tests__/person.service.test.ts`
  - [ ] Teste: criar Person com CPF inválido lança `ValidationError`
  - [ ] Teste: criar Person com CPF duplicado lança `ConflictError`
  - [ ] Teste: criar Person com dados válidos retorna Person criada
  - [ ] Teste: buscar Person por ID inexistente lança `NotFoundError`
  - [ ] Teste: atualizar Person (sem alterar CPF) retorna Person atualizada
  - [ ] Teste: deletar Person retorna sucesso
- [ ] Criar `src/modules/person/__tests__/person.controller.test.ts`
  - [ ] Teste HTTP: `POST /api/v1/persons` → 201
  - [ ] Teste HTTP: `GET /api/v1/persons/:id` → 200
  - [ ] Teste HTTP: `PATCH /api/v1/persons/:id` → 200
  - [ ] Teste HTTP: `DELETE /api/v1/persons/:id` → 204
  - [ ] Teste HTTP: rotas protegidas sem token → 401
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar `src/modules/person/person.types.ts`
- [ ] Criar `src/modules/person/person.schema.ts`
- [ ] Criar `src/modules/person/person.repository.ts`
- [ ] Criar `src/modules/person/person.service.ts`
- [ ] Criar `src/modules/person/person.controller.ts`
- [ ] Criar `src/modules/person/person.routes.ts`
- [ ] Criar `src/modules/person/index.ts`
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] CPF nunca retornado formatado pela API (só dígitos) — formatação é responsabilidade do frontend

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/person/person.types.ts` |
| Criar     | `src/modules/person/person.schema.ts` |
| Criar     | `src/modules/person/person.repository.ts` |
| Criar     | `src/modules/person/person.service.ts` |
| Criar     | `src/modules/person/person.controller.ts` |
| Criar     | `src/modules/person/person.routes.ts` |
| Criar     | `src/modules/person/index.ts` |
| Criar     | `src/modules/person/__tests__/person.service.test.ts` |
| Criar     | `src/modules/person/__tests__/person.controller.test.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] CPF inválido retorna 400 com `code: "INVALID_CPF"`
- [ ] CPF duplicado retorna 409 com `code: "CPF_ALREADY_EXISTS"`
- [ ] CPF armazenado e retornado apenas como dígitos
- [ ] Rotas protegidas por auth middleware
