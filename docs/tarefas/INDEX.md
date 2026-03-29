# PetHUB Backend — Índice de Tarefas de Desenvolvimento

## Legenda de Status
- `Pendente` — não iniciada
- `Em andamento` — em desenvolvimento
- `Concluída` — implementada, testes passando, PR merged

## Ordem de Execução

```
TASK-BE-001 → TASK-BE-002 → TASK-BE-003
                           → TASK-BE-004
                           → TASK-BE-005
                                       ↓
                              TASK-BE-006 (auth)
                                       ↓
                              TASK-BE-007 (person)
                                       ↓
                              TASK-BE-008 (organization)
                                       ↓
                              TASK-BE-009 (pet)
                              ↙        ↓         ↘
               TASK-BE-010  TASK-BE-011  TASK-BE-012
               (adoption)  (lost-found) (pet-health)
                                       ↓
                              TASK-BE-013 (services-directory)
                                       ↓
                    ┌──────────────────┴──────────────────┐
               TASK-BE-019            TASK-BE-020
           (registro atômico)     (papéis org)
                                       ↓
                              TASK-BE-021 (contexto agindo como)
                              ↙        ↓        ↓        ↘
               BE-022      BE-023   BE-024   BE-025    BE-026
           (foto org)  (foto svc) (membros) (lf-org) (svc-org)
```

## Tabela de Tarefas

| ID           | Tarefa                                      | Prioridade | Dependências                   | Status    |
|--------------|---------------------------------------------|------------|--------------------------------|-----------|
| TASK-BE-001  | Inicialização do Projeto                    | Alta       | Nenhuma                        | Concluída |
| TASK-BE-002  | Shared Infra (AppError, Logger)             | Alta       | BE-001                         | Concluída |
| TASK-BE-003  | Validator CPF                               | Alta       | BE-001                         | Concluída |
| TASK-BE-004  | Validator CNPJ                              | Alta       | BE-001                         | Concluída |
| TASK-BE-005  | Schema Prisma + Supabase                    | Alta       | BE-001                         | Concluída |
| TASK-BE-006  | Módulo Auth                                 | Alta       | BE-002, BE-005                 | Concluída |
| TASK-BE-007  | Módulo Person                               | Alta       | BE-003, BE-005, BE-006         | Concluída |
| TASK-BE-008  | Módulo Organization                         | Alta       | BE-004, BE-005, BE-006, BE-007 | Concluída |
| TASK-BE-009  | Módulo Pet                                  | Alta       | BE-005, BE-006, BE-007, BE-008 | Concluída |
| TASK-BE-010  | Módulo Adoption                             | Média      | BE-007, BE-008, BE-009         | Concluída |
| TASK-BE-011  | Módulo Lost & Found                         | Média      | BE-005, BE-006                 | Concluída |
| TASK-BE-012  | Módulo Pet Health                           | Média      | BE-009                         | Concluída |
| TASK-BE-013  | Módulo Services Directory                   | Baixa      | BE-005, BE-006                 | Concluída |
| TASK-BE-014  | Auth: verificação de email + reset de senha | Alta       | BE-006                         | Concluída |
| TASK-BE-015  | Pet: criação via JWT + transferência por CPF| Alta       | BE-009                         | Concluída |
| TASK-BE-016  | Pet: upload de foto                         | Média      | BE-009                         | Concluída |
| TASK-BE-017  | Adoption: createForUser + WhatsApp + org    | Média      | BE-010                         | Concluída |
| TASK-BE-018  | Pet: campo castrado + migration             | Baixa      | BE-009                         | Concluída |
| TASK-BE-019  | Registro atômico Person + User              | Alta       | BE-006, BE-007                 | Pendente  |
| TASK-BE-020  | Papéis em OrganizationPerson (OWNER/MGR/MBR)| Alta      | BE-008, BE-019                 | Pendente  |
| TASK-BE-021  | Contexto "Agindo Como" (organizationId)     | Alta       | BE-020                         | Pendente  |
| TASK-BE-022  | Foto de organização (upload + photoUrl)     | Média      | BE-020                         | Pendente  |
| TASK-BE-023  | Foto de serviço (upload + photoUrl)         | Média      | BE-021                         | Pendente  |
| TASK-BE-024  | Gerenciamento de membros da organização     | Alta       | BE-020                         | Pendente  |
| TASK-BE-025  | Lost & Found por organização                | Média      | BE-021                         | Pendente  |
| TASK-BE-026  | Serviço por organização + permissão         | Média      | BE-021                         | Pendente  |
