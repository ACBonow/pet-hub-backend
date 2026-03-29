# TASK-BE-019 — Registro Atômico: Person criada junto com User

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-019 |
| Módulo       | auth |
| Prioridade   | Alta |
| Dependências | TASK-BE-006 (auth), TASK-BE-007 (person) |
| Status       | Pendente |

## Objetivo
Garantir que o endpoint `POST /api/v1/auth/register` crie `User` e `Person` atomicamente em uma única transação Prisma. Se qualquer etapa falhar, nenhum registro deve persistir.

## Contexto
Atualmente o fluxo de registro pode criar o `User` sem criar a `Person` correspondente (ou vice-versa), deixando o sistema em estado inconsistente. A regra de negócio é: **todo usuário tem exatamente uma Person**; elas nascem juntas e não existem separadamente.

Campos que o endpoint já recebe e que precisam popular a Person:
- `name` → `Person.name`
- `cpf` → `Person.cpf` (11 dígitos, validado)
- `phone` → `Person.phone`

A relação é `User.personId` → `Person.id` (ou inverso, verificar schema atual).

## Checklist

### Pré-requisitos
- [ ] TASK-BE-006 concluída
- [ ] TASK-BE-007 concluída

### Red — Testes falhando primeiro
Arquivo: `src/modules/auth/__tests__/auth.service.test.ts`

- [ ] Teste: `register` com dados válidos cria User e Person — verificar que `findPersonByUserId(userId)` retorna dados corretos após o registro
- [ ] Teste: `register` com CPF já existente faz rollback de User e Person — nenhuma entidade persiste
- [ ] Teste: `register` com email já existente faz rollback — nenhuma entidade persiste
- [ ] Teste: a Person criada tem `userId` igual ao `User.id` criado
- [ ] Confirmar que os testes falham

### Green — Implementação mínima
- [ ] Ler `auth.service.ts` e identificar onde a Person é (ou não é) criada
- [ ] Envolver criação de `User` + `Person` em `prisma.$transaction([...])`
- [ ] Se `IAuthRepository` não expõe criação de Person, adicionar método `createWithPerson(data)` ou injetar `IPersonRepository` no `AuthService`
- [ ] Atualizar `AuthRepository` para executar a transação
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Garantir que o tipo de retorno de `register` inclua dados básicos da Person (sem expor CPF bruto)
- [ ] Remover qualquer código legado de criação separada de Person pós-registro

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `src/modules/auth/auth.repository.ts` |
| Modificar | `src/modules/auth/auth.service.ts` |
| Modificar | `src/modules/auth/auth.types.ts` (se RegisterInput precisar de ajuste) |
| Modificar | `src/modules/auth/__tests__/auth.service.test.ts` |

## Critérios de Aceite
- [ ] `POST /api/v1/auth/register` com dados válidos retorna 201 e o usuário já tem uma Person associada
- [ ] CPF duplicado retorna 409 com `code: "CPF_ALREADY_EXISTS"` e nenhuma entidade é criada
- [ ] Email duplicado retorna 409 com `code: "EMAIL_ALREADY_EXISTS"` e nenhuma entidade é criada
- [ ] Todos os testes existentes continuam passando
