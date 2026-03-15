# TASK-BE-005 — Schema Prisma + Configuração Supabase

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-005 |
| Módulo       | infra / database |
| Prioridade   | Alta |
| Dependências | TASK-BE-001 |
| Status       | Pendente |

## Objetivo
Definir o schema completo do Prisma para todos os módulos planejados e configurar a conexão com o Supabase (PostgreSQL), incluindo Storage.

## Contexto
- `DATABASE_URL` usa o pooler do Supabase (porta 6543, `?pgbouncer=true`) para queries serverless.
- `DIRECT_URL` usa porta 5432 exclusivamente para `prisma migrate`.
- Supabase Auth **não é utilizado** — autenticação é própria.
- Storage do Supabase será usado para arquivos de exames e imagens de pets.
- RLS deve ser habilitado nas tabelas sensíveis.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-001 concluída
- [ ] Projeto Supabase criado e `DATABASE_URL` / `DIRECT_URL` disponíveis

### Red — Testes falhando primeiro
- [ ] Escrever teste de integração básico que verifica conexão com banco em `src/__tests__/database.test.ts`
- [ ] Confirmar que falha (schema ainda não existe)

### Green — Implementação mínima
- [ ] `npx prisma init`
- [ ] Configurar `prisma/schema.prisma` com `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`
- [ ] Definir modelos:
  - `User` (autenticação: email, passwordHash, refreshToken)
  - `Person` (name, cpf único, userId)
  - `Organization` (name, type: COMPANY|NGO, cnpj opcional, responsiblePersonId)
  - `OrganizationPerson` (tabela pivot org ↔ pessoa responsável)
  - `Pet` (name, species, breed, birthDate, photoUrl)
  - `Tutorship` (petId, tutorId, tutorType: PERSON|ORGANIZATION, type: OWNER|TUTOR|TEMPORARY_HOME, active, startDate, endDate)
  - `TutorshipHistory` (registro imutável de cada tutoria)
  - `CoTutor` (petId, tutorId, tutorType)
  - `AdoptionListing` (petId, organizationId | personId, description, status)
  - `LostFoundReport` (type: LOST|FOUND, petId opcional, description, location, contactInfo, status)
  - `Vaccination` (petId, vaccineName, applicationDate, nextDueDate, veterinarianId opcional, fileUrl)
  - `ExamFile` (petId, examType, fileUrl, examDate, notes)
  - `ServiceListing` (name, type: VETERINARIAN|CLINIC|EXAM|PHARMACY|GROOMING|BOARDING|TRANSPORT|OTHER, description, address, contactInfo, organizationId opcional)
- [ ] Criar buckets no Supabase Storage: `pet-images`, `exam-files`, `documents`
- [ ] Criar `src/shared/config/database.ts` com instância singleton do PrismaClient
- [ ] Rodar `npx prisma migrate dev --name init`
- [ ] Confirmar que teste de conexão passa

### Refactor
- [ ] Adicionar índices nas colunas mais consultadas (cpf, cnpj, petId, tutorId)
- [ ] Documentar políticas de RLS planejadas em comentários no schema

### Finalização
- [ ] Migration aplicada no banco de desenvolvimento
- [ ] `prisma generate` sem erros
- [ ] PR com schema completo revisado

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `prisma/schema.prisma` |
| Criar     | `src/shared/config/database.ts` |
| Criar     | `src/__tests__/database.test.ts` |
| Modificar | `.env.example` |

## Critérios de Aceite
- [ ] `npx prisma migrate dev` roda sem erros
- [ ] `npx prisma generate` gera tipos TypeScript corretos
- [ ] Conexão com Supabase funciona em ambiente de desenvolvimento
- [ ] Buckets de Storage criados: `pet-images`, `exam-files`, `documents`
- [ ] Todos os modelos planejados estão no schema
