# TASK-BE-008 — Módulo Organization (Empresa e ONG)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-008 |
| Módulo       | organization |
| Prioridade   | Alta |
| Dependências | TASK-BE-004, TASK-BE-005, TASK-BE-006, TASK-BE-007 |
| Status       | Pendente |

## Objetivo
Implementar CRUD de organizações (empresas e ONGs) com validação de CNPJ, gerenciamento de pessoas responsáveis e suporte a múltiplos responsáveis.

## Contexto
- `type` discrimina entre `COMPANY` e `NGO`.
- Empresa (`COMPANY`): CNPJ obrigatório e válido.
- ONG (`NGO`): CNPJ opcional; se fornecido, deve ser válido.
- Toda organização precisa de pelo menos uma Person responsável no momento da criação.
- Múltiplas pessoas responsáveis são suportadas via tabela `OrganizationPerson`.
- CNPJ armazenado como 14 dígitos sem formatação.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-004 concluída (validator CNPJ)
- [ ] TASK-BE-007 concluída (Person existente para ser responsável)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/organization/__tests__/organization.service.test.ts`
  - [ ] Teste: criar Company sem CNPJ lança `ValidationError`
  - [ ] Teste: criar Company com CNPJ inválido lança `ValidationError`
  - [ ] Teste: criar NGO sem CNPJ → sucesso
  - [ ] Teste: criar NGO com CNPJ inválido lança `ValidationError`
  - [ ] Teste: criar Organization sem `responsiblePersonId` lança `ValidationError`
  - [ ] Teste: criar Organization com `responsiblePersonId` inexistente lança `NotFoundError`
  - [ ] Teste: criar Organization válida retorna Organization criada
  - [ ] Teste: adicionar segunda pessoa responsável
  - [ ] Teste: remover pessoa responsável quando há mais de uma
  - [ ] Teste: tentar remover última pessoa responsável lança `BusinessRuleError`
- [ ] Criar `src/modules/organization/__tests__/organization.controller.test.ts`
  - [ ] Teste HTTP: `POST /api/v1/organizations` → 201
  - [ ] Teste HTTP: `GET /api/v1/organizations/:id` → 200
  - [ ] Teste HTTP: `PATCH /api/v1/organizations/:id` → 200
  - [ ] Teste HTTP: `DELETE /api/v1/organizations/:id` → 204
  - [ ] Teste HTTP: `POST /api/v1/organizations/:id/responsible-persons` → 201
  - [ ] Teste HTTP: `DELETE /api/v1/organizations/:id/responsible-persons/:personId` → 204
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar `src/modules/organization/organization.types.ts`
- [ ] Criar `src/modules/organization/organization.schema.ts`
- [ ] Criar `src/modules/organization/organization.repository.ts`
- [ ] Criar `src/modules/organization/organization.service.ts`
- [ ] Criar `src/modules/organization/organization.controller.ts`
- [ ] Criar `src/modules/organization/organization.routes.ts`
- [ ] Criar `src/modules/organization/index.ts`
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Extrair validação condicional de CNPJ para função auxiliar no service

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/organization/organization.types.ts` |
| Criar     | `src/modules/organization/organization.schema.ts` |
| Criar     | `src/modules/organization/organization.repository.ts` |
| Criar     | `src/modules/organization/organization.service.ts` |
| Criar     | `src/modules/organization/organization.controller.ts` |
| Criar     | `src/modules/organization/organization.routes.ts` |
| Criar     | `src/modules/organization/index.ts` |
| Criar     | `src/modules/organization/__tests__/organization.service.test.ts` |
| Criar     | `src/modules/organization/__tests__/organization.controller.test.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] Empresa sem CNPJ retorna 400 com `code: "CNPJ_REQUIRED"`
- [ ] CNPJ inválido retorna 400 com `code: "INVALID_CNPJ"`
- [ ] ONG sem CNPJ criada com sucesso
- [ ] Criação sem pessoa responsável retorna 400 com `code: "RESPONSIBLE_PERSON_REQUIRED"`
- [ ] Remoção da última pessoa responsável retorna 409 com `code: "LAST_RESPONSIBLE_PERSON"`
