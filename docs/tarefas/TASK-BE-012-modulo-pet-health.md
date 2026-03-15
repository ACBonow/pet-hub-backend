# TASK-BE-012 — Módulo Pet Health (Saúde do Pet)

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-012 |
| Módulo       | pet-health |
| Prioridade   | Média |
| Dependências | TASK-BE-009 |
| Status       | Pendente |

## Objetivo
Implementar carteirinha de vacinação online, upload e gerenciamento de arquivos de exames, e base para lembretes futuros.

## Contexto
- Carteirinha de vacinação: histórico de vacinas por pet, com data de aplicação e próxima dose.
- Arquivos de exames: imagens e PDFs armazenados no bucket `exam-files` do Supabase Storage.
- Acesso restrito: apenas tutor primário e co-tutores podem ver/adicionar registros.
- Lembretes de vacinação e campanhas de desconto são funcionalidades futuras (estrutura de dados já planejada).

## Checklist

### Pré-requisitos
- [ ] TASK-BE-009 concluída (Pet e Tutorship)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/pet-health/__tests__/petHealth.service.test.ts`
  - [ ] Teste: adicionar vacinação a pet inexistente lança `NotFoundError`
  - [ ] Teste: adicionar vacinação válida retorna registro criado
  - [ ] Teste: listar vacinações por pet retorna histórico ordenado por data
  - [ ] Teste: usuário sem tutoria não pode acessar registros de saúde (lança `ForbiddenError`)
  - [ ] Teste: fazer upload de arquivo de exame retorna URL do arquivo
  - [ ] Teste: listar arquivos de exame por pet
  - [ ] Teste: deletar arquivo de exame remove do Storage e do banco
- [ ] Criar `src/modules/pet-health/__tests__/petHealth.controller.test.ts`
  - [ ] Teste HTTP: `GET /api/v1/pet-health/:petId/vaccination-card` → 200
  - [ ] Teste HTTP: `POST /api/v1/pet-health/:petId/vaccinations` → 201
  - [ ] Teste HTTP: `GET /api/v1/pet-health/:petId/exams` → 200
  - [ ] Teste HTTP: `POST /api/v1/pet-health/:petId/exams` → 201 (multipart)
  - [ ] Teste HTTP: `DELETE /api/v1/pet-health/:petId/exams/:examId` → 204
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar arquivos do módulo
- [ ] Integrar com `shared/utils/storage.ts` para uploads
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/pet-health/petHealth.types.ts` |
| Criar     | `src/modules/pet-health/petHealth.schema.ts` |
| Criar     | `src/modules/pet-health/petHealth.repository.ts` |
| Criar     | `src/modules/pet-health/petHealth.service.ts` |
| Criar     | `src/modules/pet-health/petHealth.controller.ts` |
| Criar     | `src/modules/pet-health/petHealth.routes.ts` |
| Criar     | `src/modules/pet-health/index.ts` |
| Criar     | `src/modules/pet-health/__tests__/petHealth.service.test.ts` |
| Criar     | `src/modules/pet-health/__tests__/petHealth.controller.test.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] Carteirinha de vacinação acessível apenas por tutores do pet
- [ ] Arquivos de exame armazenados no bucket `exam-files`
- [ ] Deleção de exame remove arquivo do Storage e registro do banco
- [ ] Histórico de vacinações ordenado por data decrescente
