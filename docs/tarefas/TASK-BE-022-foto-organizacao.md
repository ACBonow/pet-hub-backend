# TASK-BE-022 — Foto de Organização: upload endpoint + photoUrl no schema

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-022 |
| Módulo       | organization |
| Prioridade   | Média |
| Dependências | TASK-BE-020 (papéis — para validar quem pode fazer upload) |
| Status       | Pendente |

## Objetivo
Adicionar suporte a foto/logo para organizações. Criar campo `photoUrl` no model `Organization`, bucket `org-images` no Supabase Storage e endpoint `PATCH /api/v1/organizations/:id/photo`.

## Contexto
O padrão de upload de foto já existe no módulo `pet` (TASK-BE-016). Seguir o mesmo padrão: multipart/form-data, upload para Supabase Storage, salvar URL no banco, excluir foto anterior ao substituir.

### Bucket Supabase Storage
- Nome: `org-images`
- Acesso: público para leitura
- Path do arquivo: `{orgId}/{timestamp}-{originalname}`

## Checklist

### Schema e Migration
- [ ] Adicionar campo `photoUrl String?` ao model `Organization` no `schema.prisma`
- [ ] Executar `npx prisma migrate dev --name add_org_photo_url`

### Red — Testes falhando primeiro
Arquivo: `src/modules/organization/__tests__/organization.controller.test.ts`

- [ ] Teste: `PATCH /api/v1/organizations/:id/photo` sem autenticação → 401
- [ ] Teste: upload por MEMBER → 403
- [ ] Teste: upload por MANAGER → 200 com `photoUrl` atualizado
- [ ] Teste: upload por OWNER → 200 com `photoUrl` atualizado
- [ ] Teste: segundo upload remove o arquivo anterior do storage (mock do storage service)
- [ ] Confirmar que os testes falham

### Green — Implementação mínima
- [ ] Criar bucket `org-images` no Supabase (registrar no CLAUDE.md)
- [ ] Adicionar método `updatePhoto(orgId, photoUrl)` em `organization.repository.ts`
- [ ] Adicionar método `uploadPhoto(orgId, file)` em `organization.service.ts`:
  - Verificar se org já tem foto → deletar arquivo anterior no storage
  - Fazer upload do novo arquivo para `org-images/{orgId}/`
  - Salvar URL retornada no banco via repository
- [ ] Adicionar handler `uploadPhoto` em `organization.controller.ts`
- [ ] Adicionar rota `PATCH /organizations/:id/photo` com middleware multipart em `organization.routes.ts`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Extrair helper de upload/delete para `shared/utils/storage.ts` (reutilizável por org, service, pet)

### Finalização
- [ ] Todos os testes passando
- [ ] `tsc --noEmit` sem erros
- [ ] PR aberto com base em `homologacao`

## Arquivos a Criar / Modificar

| Ação      | Arquivo |
|-----------|---------|
| Modificar | `prisma/schema.prisma` |
| Criar     | `prisma/migrations/YYYYMMDDHHMMSS_add_org_photo_url/` |
| Modificar | `src/modules/organization/organization.types.ts` |
| Modificar | `src/modules/organization/organization.repository.ts` |
| Modificar | `src/modules/organization/organization.service.ts` |
| Modificar | `src/modules/organization/organization.controller.ts` |
| Modificar | `src/modules/organization/organization.routes.ts` |
| Modificar | `src/shared/utils/storage.ts` (ou criar se não existir) |
| Modificar | `src/modules/organization/__tests__/organization.controller.test.ts` |

## Critérios de Aceite
- [ ] `PATCH /api/v1/organizations/:id/photo` por OWNER ou MANAGER → 200 com `data.photoUrl` preenchido
- [ ] Upload por MEMBER → 403 com `code: "INSUFFICIENT_PERMISSION"`
- [ ] Foto anterior é removida do storage ao substituir
- [ ] Org sem foto retorna `photoUrl: null`
