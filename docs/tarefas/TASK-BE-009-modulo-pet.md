# TASK-BE-009 — Módulo Pet

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-009 |
| Módulo       | pet |
| Prioridade   | Alta |
| Dependências | TASK-BE-005, TASK-BE-006, TASK-BE-007, TASK-BE-008 |
| Status       | Pendente |

## Objetivo
Implementar CRUD de pets com gerenciamento de tutoria (primária e co-tutores), transferência de tutoria com histórico e upload de foto via Supabase Storage.

## Contexto
- Um pet tem exatamente um tutor primário ativo (type: `OWNER`, `TUTOR`, `TEMPORARY_HOME`).
- Tutor pode ser uma Person ou Organization.
- Transferência de tutoria cria registro em `TutorshipHistory` e desativa a tutoria anterior.
- Co-tutores são vinculações adicionais sem tutoria primária.
- Foto do pet é armazenada no bucket `pet-images` do Supabase Storage.
- `SUPABASE_SERVICE_ROLE_KEY` é usada no backend para upload — nunca exposta ao frontend.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-005 concluída (modelos Pet, Tutorship, TutorshipHistory, CoTutor)
- [ ] TASK-BE-007 concluída (Person)
- [ ] TASK-BE-008 concluída (Organization)

### Red — Testes falhando primeiro
- [ ] Criar `src/modules/pet/__tests__/pet.service.test.ts`
  - [ ] Teste: criar Pet sem tutor lança `ValidationError`
  - [ ] Teste: criar Pet com tutor inexistente lança `NotFoundError`
  - [ ] Teste: criar Pet válido cria Tutorship ativa
  - [ ] Teste: buscar Pet por ID retorna dados com tutor atual
  - [ ] Teste: transferir tutoria cria TutorshipHistory e nova Tutorship ativa
  - [ ] Teste: adicionar co-tutor válido
  - [ ] Teste: adicionar co-tutor que já é tutor primário lança `BusinessRuleError`
  - [ ] Teste: remover co-tutor
- [ ] Criar `src/modules/pet/__tests__/pet.controller.test.ts`
  - [ ] Teste HTTP: `POST /api/v1/pets` → 201
  - [ ] Teste HTTP: `GET /api/v1/pets/:id` → 200
  - [ ] Teste HTTP: `PATCH /api/v1/pets/:id` → 200
  - [ ] Teste HTTP: `DELETE /api/v1/pets/:id` → 204
  - [ ] Teste HTTP: `POST /api/v1/pets/:id/transfer-tutorship` → 200
  - [ ] Teste HTTP: `GET /api/v1/pets/:id/tutorship-history` → 200
  - [ ] Teste HTTP: `POST /api/v1/pets/:id/co-tutors` → 201
  - [ ] Teste HTTP: `DELETE /api/v1/pets/:id/co-tutors/:tutorId` → 204
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar `src/modules/pet/pet.types.ts`
- [ ] Criar `src/modules/pet/pet.schema.ts`
- [ ] Criar `src/modules/pet/pet.repository.ts`
- [ ] Criar `src/modules/pet/pet.service.ts`
- [ ] Criar `src/modules/pet/pet.controller.ts`
- [ ] Criar `src/modules/pet/pet.routes.ts`
- [ ] Criar `src/modules/pet/index.ts`
- [ ] Criar `src/shared/utils/storage.ts` (helper para upload/delete no Supabase Storage)
- [ ] Registrar rotas em `src/app.ts`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Extrair lógica de tutoria para `tutorship.service.ts` dentro do módulo

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage mínimo atingido
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Criar     | `src/modules/pet/pet.types.ts` |
| Criar     | `src/modules/pet/pet.schema.ts` |
| Criar     | `src/modules/pet/pet.repository.ts` |
| Criar     | `src/modules/pet/pet.service.ts` |
| Criar     | `src/modules/pet/pet.controller.ts` |
| Criar     | `src/modules/pet/pet.routes.ts` |
| Criar     | `src/modules/pet/index.ts` |
| Criar     | `src/modules/pet/__tests__/pet.service.test.ts` |
| Criar     | `src/modules/pet/__tests__/pet.controller.test.ts` |
| Criar     | `src/shared/utils/storage.ts` |
| Modificar | `src/app.ts` |

## Critérios de Aceite
- [ ] Pet sempre criado com tutoria primária ativa
- [ ] Transferência de tutoria registra histórico e desativa tutoria anterior
- [ ] Co-tutor não pode ser o mesmo que o tutor primário
- [ ] Foto armazenada no bucket `pet-images` e URL salva no banco
- [ ] Histórico de tutoria disponível via `GET /api/v1/pets/:id/tutorship-history`
