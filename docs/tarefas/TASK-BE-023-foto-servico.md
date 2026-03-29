# TASK-BE-023 — Foto de Serviço: upload endpoint + photoUrl no schema

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-023 |
| Módulo       | services-directory |
| Prioridade   | Média |
| Dependências | TASK-BE-021 (contexto "agindo como" — para validar proprietário) |
| Status       | Pendente |

## Objetivo
Adicionar suporte a foto de capa para serviços. Criar campo `photoUrl` no model `ServiceListing`, bucket `service-images` no Supabase Storage e endpoint `PATCH /api/v1/services/:id/photo`.

## Contexto
Segue o mesmo padrão de upload de foto já implementado para pets (TASK-BE-016) e organizações (TASK-BE-022).

### Regras de permissão para upload
- Serviço pessoal (sem `organizationId`): apenas o criador do serviço (`createdByUserId`) pode fazer upload.
- Serviço de organização (com `organizationId`): qualquer `OWNER` ou `MANAGER` da organização pode fazer upload.

### Bucket Supabase Storage
- Nome: `service-images`
- Acesso: público para leitura
- Path do arquivo: `{serviceId}/{timestamp}-{originalname}`

## Checklist

### Schema e Migration
- [ ] Verificar se `ServiceListing` já tem campo `photoUrl` — adicionar `photoUrl String?` se não tiver
- [ ] Verificar se `ServiceListing` tem campo `createdByUserId` para auditoria — adicionar se necessário
- [ ] Executar `npx prisma migrate dev --name add_service_photo_url`

### Red — Testes falhando primeiro
Arquivo: `src/modules/services-directory/__tests__/services-directory.controller.test.ts`

- [ ] Teste: `PATCH /api/v1/services/:id/photo` sem autenticação → 401
- [ ] Teste: upload por usuário que não é criador e não tem vínculo com a org → 403
- [ ] Teste: upload pelo criador do serviço pessoal → 200
- [ ] Teste: upload por MANAGER da org vinculada → 200
- [ ] Teste: arquivo anterior removido do storage no segundo upload
- [ ] Confirmar que os testes falham

### Green — Implementação mínima
- [ ] Criar bucket `service-images` no Supabase
- [ ] Adicionar campo `createdByUserId` em `ServiceListing` se não existir (migration)
- [ ] Adicionar método `updatePhoto(serviceId, photoUrl)` em `services-directory.repository.ts`
- [ ] Adicionar método `uploadPhoto(serviceId, userId, file)` em `services-directory.service.ts`
- [ ] Adicionar handler e rota `PATCH /services/:id/photo`
- [ ] Confirmar que todos os testes passam

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `prisma/schema.prisma` |
| Criar     | `prisma/migrations/YYYYMMDDHHMMSS_add_service_photo_url/` |
| Modificar | `src/modules/services-directory/services-directory.types.ts` |
| Modificar | `src/modules/services-directory/services-directory.repository.ts` |
| Modificar | `src/modules/services-directory/services-directory.service.ts` |
| Modificar | `src/modules/services-directory/services-directory.controller.ts` |
| Modificar | `src/modules/services-directory/services-directory.routes.ts` |
| Modificar | `src/modules/services-directory/__tests__/services-directory.controller.test.ts` |

## Critérios de Aceite
- [ ] `PATCH /api/v1/services/:id/photo` por criador ou OWNER/MANAGER da org → 200 com `data.photoUrl`
- [ ] Upload por usuário sem permissão → 403 com `code: "INSUFFICIENT_PERMISSION"`
- [ ] Foto anterior removida do storage ao substituir
- [ ] Serviço sem foto retorna `photoUrl: null`
