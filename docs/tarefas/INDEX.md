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
```

## Tabela de Tarefas

| ID           | Tarefa                             | Prioridade | Dependências                      | Status   |
|--------------|------------------------------------|------------|-----------------------------------|----------|
| TASK-BE-001  | Inicialização do Projeto           | Alta       | Nenhuma                           | Pendente |
| TASK-BE-002  | Shared Infra (AppError, Logger)    | Alta       | BE-001                            | Pendente |
| TASK-BE-003  | Validator CPF                      | Alta       | BE-001                            | Pendente |
| TASK-BE-004  | Validator CNPJ                     | Alta       | BE-001                            | Pendente |
| TASK-BE-005  | Schema Prisma + Supabase           | Alta       | BE-001                            | Pendente |
| TASK-BE-006  | Módulo Auth                        | Alta       | BE-002, BE-005                    | Pendente |
| TASK-BE-007  | Módulo Person                      | Alta       | BE-003, BE-005, BE-006            | Pendente |
| TASK-BE-008  | Módulo Organization                | Alta       | BE-004, BE-005, BE-006, BE-007    | Pendente |
| TASK-BE-009  | Módulo Pet                         | Alta       | BE-005, BE-006, BE-007, BE-008    | Pendente |
| TASK-BE-010  | Módulo Adoption                    | Média      | BE-007, BE-008, BE-009            | Pendente |
| TASK-BE-011  | Módulo Lost & Found                | Média      | BE-005, BE-006                    | Pendente |
| TASK-BE-012  | Módulo Pet Health                  | Média      | BE-009                            | Pendente |
| TASK-BE-013  | Módulo Services Directory          | Baixa      | BE-005, BE-006                    | Pendente |
