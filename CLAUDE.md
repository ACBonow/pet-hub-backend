# CLAUDE.md — Instruções para o Claude AI no PetHUB (Backend)

Leia este arquivo integralmente antes de escrever qualquer código ou fazer qualquer modificação.

---

## O que é este projeto?

PetHUB é um sistema web brasileiro de gerenciamento de vida do pet (petcare / saúde animal). Gerencia pessoas (com CPF), organizações (empresas com CNPJ, ONGs com CNPJ opcional), pets, listagens de adoção, relatórios de achados/perdidos, registros de saúde do pet e um diretório de serviços pet.

O sistema é mobile-first e segue TDD estritamente.

---

## Repositórios

- **Backend** (este repo): Node.js + TypeScript, Vercel serverless
- **Frontend**: React + TypeScript, Vercel

---

## Stack Técnica

- **Runtime**: Node.js
- **Linguagem**: TypeScript (strict mode)
- **Framework HTTP**: Fastify (preferido por performance serverless) ou Express
- **ORM**: Prisma — schema-first, excelente suporte TypeScript
- **Banco**: Supabase (PostgreSQL gerenciado)
- **Storage**: Supabase Storage (arquivos de exames, imagens de pets, documentos)
- **Validação**: Zod
- **Auth**: JWT + refresh tokens, bcrypt para senhas
- **Testes**: Jest + supertest
- **Deploy**: Vercel

---

## Regras Inegociáveis

1. **TDD é obrigatório.** Escreva um teste falhando antes de qualquer código de produção. Não pule esta etapa.
2. **Nunca escreva lógica de negócio em controllers.** Controllers lidam apenas com HTTP.
3. **Nunca escreva queries de banco em services.** Queries ficam em repositories.
4. **Nunca importe dos internos de outro módulo.** Use o `index.ts` do módulo ou `shared/`.
5. **Toda entrada de CPF deve ser validada** usando o algoritmo de dígito verificador em `shared/validators/cpf.validator.ts`.
6. **Toda entrada de CNPJ deve ser validada** usando o algoritmo em `shared/validators/cnpj.validator.ts`. Para ONGs, CNPJ é opcional — mas se fornecido, deve ser válido.
7. **Respostas de erro devem sempre usar o envelope padrão** (`{ success, error: { code, message } }`).
8. **Texto voltado ao usuário deve ser em português brasileiro.** Identificadores de código são sempre em inglês.
9. **Nunca use `any` sem um comentário explicando o motivo.**
10. **Nunca use `console.log` em código de produção** — use o logger em `shared/utils/logger.ts`.
11. **`register` cria User + Person atomicamente.** Use `prisma.$transaction` — nunca crie um sem o outro. Rollback total em caso de falha.
12. **Endpoints que aceitam `organizationId` no body devem chamar `resolveActorContext`** de `shared/utils/resolve-actor-context.ts` antes de qualquer operação. Esta função valida que o usuário tem papel OWNER ou MANAGER na organização. Nunca valide permissão de org inline no service ou controller.
13. **Permissões de organização são verificadas via `hasOrgPermission`** de `shared/utils/org-permission.ts`. Nunca implemente verificação de papel inline — sempre use o helper compartilhado.

---

## Como Adicionar um Novo Módulo

Siga esta sequência exatamente:

1. Crie a pasta: `src/modules/<module-name>/`
2. Crie `<module-name>.types.ts` — defina todas as interfaces TypeScript primeiro.
3. Crie `<module-name>.schema.ts` — defina os schemas Zod de validação.
4. Crie `<module-name>.repository.ts` — defina a interface e uma implementação stub.
5. Escreva os testes em `__tests__/<module-name>.service.test.ts` — devem falhar (red).
6. Crie `<module-name>.service.ts` — implemente até os testes passarem (green).
7. Refatore o service se necessário.
8. Escreva os testes em `__tests__/<module-name>.controller.test.ts`.
9. Crie `<module-name>.controller.ts` — implemente até os testes passarem.
10. Crie `<module-name>.routes.ts` — conecte rotas ao controller.
11. Registre as rotas em `src/app.ts`.
12. Exporte a superfície pública em `src/modules/<module-name>/index.ts`.

---

## Estrutura de Pastas

```
src/
├── modules/
│   ├── auth/
│   ├── person/
│   ├── organization/
│   ├── pet/
│   ├── adoption/
│   ├── lost-found/
│   ├── pet-health/
│   └── services-directory/
├── shared/
│   ├── validators/
│   │   ├── cpf.validator.ts
│   │   └── cnpj.validator.ts
│   ├── middleware/
│   ├── errors/
│   │   ├── AppError.ts
│   │   └── HttpError.ts
│   ├── utils/
│   │   └── logger.ts
│   └── types/
├── config/
│   ├── env.ts
│   ├── database.ts
│   └── cors.ts
├── app.ts
└── server.ts
api/
└── index.ts  ← Vercel serverless entry point
```

---

## Regras de Domínio para Garantir no Código

### Person
- CPF é obrigatório e deve passar na validação.
- CPF deve ser único entre todas as pessoas.
- Armazene CPF apenas como dígitos (sem formatação).

### Organization (Empresa e ONG)
- Campo `type` deve ser `COMPANY` ou `NGO`.
- Empresa: CNPJ obrigatório e válido.
- ONG: CNPJ opcional. Se fornecido, deve ser válido.
- Toda organização deve ter pelo menos uma pessoa responsável no momento da criação.
- O criador da organização recebe automaticamente o papel `OWNER` (via `OrganizationPerson.role`).
- Papéis disponíveis: `OWNER` (administrador total), `MANAGER` (operacional), `MEMBER` (criação básica).
- Apenas `OWNER` pode editar dados da org, gerenciar membros ou excluir a org.
- Nunca permita remover ou rebaixar o último `OWNER` — retornar 409 `LAST_OWNER`.
- Verificação de papel: sempre use `hasOrgPermission(userId, orgId, minRole)` de `shared/utils/org-permission.ts`.

### Pet
- Um pet deve ter exatamente um tutor primário (`owner`, `tutor` ou `temporary-home`).
- Tutor pode ser uma Person, Company ou NGO.
- Transferência de tutoria cria um registro `TutorshipHistory` e atualiza o tutor atual.
- Co-tutores são armazenados separadamente e não afetam a tutoria primária.

### Auth
- Use JWT com refresh tokens.
- Access token expiry: curto (ex.: 15 minutos).
- Refresh token expiry: mais longo (ex.: 7 dias).
- Nunca armazene senhas em texto puro — sempre faça hash com bcrypt.
- Rotas protegidas exigem o guard `auth.middleware.ts`.

---

## Padrão de Header de Arquivo

Todo novo arquivo deve começar com um bloco de comentário JSDoc breve:

```typescript
/**
 * @module person
 * @file person.service.ts
 * @description Lógica de negócio para gerenciamento de pessoas, incluindo validação de CPF.
 */
```

---

## Response Envelope (obrigatório)

Sucesso:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 100 }
}
```

Erro:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CPF",
    "message": "O CPF informado não é válido.",
    "details": []
  }
}
```

---

## Regras de Uso do Supabase

### Banco de Dados (Prisma + Supabase PostgreSQL)

- Use `DATABASE_URL` com o pooler do Supabase (porta 6543, `?pgbouncer=true`) para queries serverless.
- Use `DIRECT_URL` (porta 5432) exclusivamente para migrations (`prisma migrate`).
- Nunca use o Supabase JS client para queries de banco — use sempre o Prisma client.
- Migrations são gerenciadas pelo Prisma (`prisma migrate dev` / `prisma migrate deploy`), não pelo painel do Supabase.

### Storage (arquivos de exames, imagens)

- Arquivos de exames e imagens são salvos no **Supabase Storage**.
- O backend usa `SUPABASE_SERVICE_ROLE_KEY` para operações de storage (upload, delete).
- O frontend recebe URLs públicas — nunca acessa o storage diretamente com a service role key.
- Nunca salve binários diretamente no banco — sempre use Storage e salve apenas a URL no campo `photoUrl`.
- Ao substituir uma imagem, **sempre delete o arquivo anterior** do storage antes de fazer o upload novo.

Buckets e seus usos:

| Bucket | Conteúdo | Acesso |
|--------|----------|--------|
| `pet-images` | Fotos de pets | Público |
| `org-images` | Fotos/logos de organizações | Público |
| `service-images` | Fotos de serviços | Público |
| `exam-files` | Arquivos de exames | Privado |
| `documents` | Documentos gerais | Privado |

Path padrão de arquivo: `{entityId}/{timestamp}-{originalname}`

### Autenticação

O **Supabase Auth não é utilizado**. A autenticação é própria: JWT + refresh tokens + bcrypt (módulo `auth`). O Supabase é usado apenas como banco de dados (PostgreSQL via Prisma) e storage de arquivos.

### Segurança

- `SUPABASE_SERVICE_ROLE_KEY` é usada **somente no backend**. Nunca exponha no frontend.
- `SUPABASE_ANON_KEY` pode ser usada no frontend para operações públicas (ex.: listas de adoção).
- Row Level Security (RLS) deve ser habilitado nas tabelas sensíveis. Documente as políticas.

---

## Códigos de Erro Padrão

| Code | Status | Situação |
|------|--------|----------|
| `INVALID_CPF` | 400 | CPF com dígito verificador inválido |
| `INVALID_CNPJ` | 400 | CNPJ com dígito verificador inválido |
| `CNPJ_REQUIRED` | 400 | CNPJ ausente em organização do tipo COMPANY |
| `RESPONSIBLE_PERSON_REQUIRED` | 400 | Organização criada sem pessoa responsável |
| `EMAIL_ALREADY_EXISTS` | 409 | E-mail já cadastrado |
| `CPF_ALREADY_EXISTS` | 409 | CPF já cadastrado |
| `ALREADY_A_MEMBER` | 409 | Pessoa já é membro da organização |
| `LAST_OWNER` | 409 | Tentativa de remover/rebaixar o último OWNER |
| `INSUFFICIENT_PERMISSION` | 403 | Usuário sem papel suficiente para a ação na org |
| `PERSON_NOT_FOUND` | 404 | CPF informado não corresponde a nenhuma Person |
| `EMAIL_NOT_VERIFIED` | 403 | Login com e-mail não verificado |
| `INVALID_VERIFICATION_TOKEN` | 400 | Token de verificação inválido |
| `VERIFICATION_TOKEN_EXPIRED` | 400 | Token de verificação expirado |
| `INVALID_RESET_TOKEN` | 400 | Token de reset de senha inválido |
| `RESET_TOKEN_EXPIRED` | 400 | Token de reset expirado |

## O que o Claude NÃO deve fazer

- Não modifique `shared/validators/` sem atualizar também o arquivo de testes correspondente.
- Não adicione uma nova dependência sem mencionar explicitamente para o desenvolvedor instalar.
- Não crie arquivos fora da estrutura de pastas acordada sem explicar o motivo.
- Não retorne dados mock/placeholder de um service — mock o repository em vez disso.
- Não hardcode valores sensíveis ao ambiente (URLs, secrets) — sempre use `config/env.ts`.
- Não use `console.log` em código de produção.
- Não implemente verificação de papel de organização inline — sempre use `hasOrgPermission`.
- Não crie User sem criar Person na mesma transação — nunca separe essas duas operações.

---

## Fluxo Git por Task

Ao concluir a task (todos os testes passando):
```bash
git add <arquivos específicos>
git commit -m "type(scope): descrição"
git push origin main
```

Regras:
- Commitar diretamente em `main`.
- Nunca usar feature branches ou PRs.

---

## Pedindo Esclarecimento

Se uma solicitação for ambígua sobre:
- A qual módulo pertence
- Se um campo é obrigatório ou opcional
- Se uma regra é de validação ou de negócio

...pergunte antes de escrever código. É melhor esclarecer uma vez do que refatorar duas.