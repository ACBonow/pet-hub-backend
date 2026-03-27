# PetHUB — Documentação de Entidades e Regras de Criação

> Gerado em: 2026-03-26
> Versão do schema: migration `20260315021841_init`

---

## Visão Geral

O PetHUB possui 4 entidades centrais com regras de criação bem definidas:

| Entidade | Tabela DB | Autenticação necessária | Módulo |
|---|---|---|---|
| **User** | `users` | Não (registro público) | `auth` |
| **Person** | `persons` | Sim (JWT) | `person` |
| **Organization** | `organizations` | Sim (JWT) | `organization` |
| **Pet** | `pets` | Sim (JWT) | `pet` |

---

## Fluxo de Onboarding

```
1. POST /api/v1/auth/register     → cria User (conta)
2. POST /api/v1/auth/verify-email → verifica e-mail (obrigatório antes do login)
3. POST /api/v1/auth/login        → obtém accessToken + refreshToken
4. POST /api/v1/persons           → cria perfil Person (vinculado ao User via JWT)
5. POST /api/v1/pets              → cria Pet (tutor derivado automaticamente do Person via JWT)
```

---

## 1. User (Módulo `auth`)

### O que é
Conta de acesso ao sistema. Armazena credenciais e estado de verificação de e-mail.
Cada User pode ter **no máximo 1** perfil Person associado.

### Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Não | Cria conta e envia e-mail de verificação |
| `POST` | `/api/v1/auth/login` | Não | Autentica e retorna tokens |
| `POST` | `/api/v1/auth/refresh` | Não | Renova accessToken via refreshToken |
| `POST` | `/api/v1/auth/logout` | **Sim** | Invalida refreshToken |
| `POST` | `/api/v1/auth/verify-email` | Não | Confirma e-mail com token |
| `POST` | `/api/v1/auth/resend-verification` | Não | Reenvia e-mail de verificação |
| `POST` | `/api/v1/auth/forgot-password` | Não | Solicita redefinição de senha |
| `POST` | `/api/v1/auth/reset-password` | Não | Redefine senha com token |

### Criação — `POST /api/v1/auth/register`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minimo8chars"
}
```

**Regras de validação:**
- `email`: obrigatório, formato de e-mail válido
- `password`: obrigatório, mínimo 8 caracteres

**Regras de negócio:**
1. E-mail deve ser único — retorna `EMAIL_ALREADY_IN_USE` (409) se já existir
2. Senha é armazenada como hash bcrypt (10 rounds) — nunca em texto puro
3. Um token de verificação de e-mail (64 chars hex) é gerado e enviado por e-mail automaticamente
4. O token de verificação expira em **24 horas**
5. O usuário recebe tokens JWT de acesso mesmo antes de verificar o e-mail

**Resposta de sucesso (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { "id": "uuid", "email": "usuario@exemplo.com" }
  }
}
```

### Login — `POST /api/v1/auth/login`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenhа"
}
```

**Regras de negócio:**
1. Retorna `401 Unauthorized` com mensagem genérica se e-mail ou senha estiverem errados (sem info leak)
2. Retorna `403 EMAIL_NOT_VERIFIED` se o e-mail não foi verificado — o usuário deve confirmar o e-mail antes de fazer login
3. Gera novo par de tokens a cada login (rotação de refreshToken)

**Access token:** expira conforme `JWT_EXPIRES_IN` (padrão: 15 minutos)
**Refresh token:** expira conforme `JWT_REFRESH_EXPIRES_IN` (padrão: 7 dias)

### Tokens JWT

- **Access token:** payload `{ sub: userId }`, assina com `JWT_SECRET`
- **Refresh token:** payload `{ sub: userId }`, assina com `JWT_REFRESH_SECRET`
- Rotas protegidas exigem `Authorization: Bearer <accessToken>` no header

### Reset de Senha

1. `POST /forgot-password` com `{ "email": "..." }` — sempre retorna 200 (sem info leak)
2. Token de reset (64 chars hex) é enviado por e-mail, expira em **1 hora**
3. `POST /reset-password` com `{ "token": "...", "newPassword": "..." }` — define nova senha e invalida o token

---

## 2. Person (Módulo `person`)

### O que é
Perfil de pessoa física vinculado a um User. Contém dados pessoais incluindo CPF.
Uma Person pode ser tutora de pets, responsável por organizações, e co-tutora.

### Pré-requisito
O usuário deve estar **autenticado** e ter e-mail **verificado**. O `userId` é extraído do JWT automaticamente — não é enviado no body.

### Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/persons` | **Sim** | Cria perfil de pessoa para o usuário autenticado |
| `GET` | `/api/v1/persons/me` | **Sim** | Retorna o perfil da pessoa do usuário autenticado |
| `GET` | `/api/v1/persons/:id` | **Sim** | Busca pessoa por ID |
| `PATCH` | `/api/v1/persons/:id` | **Sim** | Atualiza nome e/ou telefone |
| `DELETE` | `/api/v1/persons/:id` | **Sim** | Remove o perfil (cascata: remove pets, tutorships) |

### Criação — `POST /api/v1/persons`

**Body:**
```json
{
  "name": "João da Silva",
  "cpf": "529.982.247-25",
  "phone": "(11) 91234-5678"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `name` | string | Sim | Mínimo 2 caracteres |
| `cpf` | string | Sim | CPF válido (check-digit); aceita formatado ou só dígitos |
| `phone` | string | Não | Livre (sem validação de formato) |

**Regras de negócio:**
1. CPF é sanitizado (apenas dígitos) antes de qualquer validação
2. CPF deve passar no algoritmo de dígito verificador — retorna `INVALID_CPF` (400) se inválido
3. CPF deve ser único no sistema — retorna `CPF_ALREADY_IN_USE` (409) se já cadastrado
4. Cada User só pode ter **1 perfil Person** — retorna `PROFILE_ALREADY_EXISTS` (409) se já existir
5. CPF é armazenado apenas como 11 dígitos (sem formatação)
6. `userId` é vinculado automaticamente via JWT (não enviado no body)

**Atualização — `PATCH /api/v1/persons/:id`:**
```json
{
  "name": "João Silva Santos",
  "phone": null
}
```
Apenas `name` e `phone` podem ser atualizados. CPF e `userId` são imutáveis.

---

## 3. Organization (Módulo `organization`)

### O que é
Empresa (COMPANY) ou ONG (NGO) que pode ser tutora de pets e ter pessoas responsáveis vinculadas.

### Diferença entre COMPANY e NGO

| Regra | COMPANY | NGO |
|---|---|---|
| CNPJ | **Obrigatório e válido** | Opcional; se fornecido, deve ser válido |
| Pessoa responsável | Obrigatória (mínimo 1) | Obrigatória (mínimo 1) |

### Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/organizations` | **Sim** | Cria organização |
| `GET` | `/api/v1/organizations/:id` | **Sim** | Busca organização por ID |
| `PATCH` | `/api/v1/organizations/:id` | **Sim** | Atualiza dados da organização |
| `DELETE` | `/api/v1/organizations/:id` | **Sim** | Remove a organização |
| `POST` | `/api/v1/organizations/:id/persons/:personId` | **Sim** | Adiciona pessoa responsável |
| `DELETE` | `/api/v1/organizations/:id/persons/:personId` | **Sim** | Remove pessoa responsável |

### Criação — `POST /api/v1/organizations`

**Body:**
```json
{
  "name": "Clínica PetCare",
  "type": "COMPANY",
  "cnpj": "11.222.333/0001-81",
  "description": "Clínica veterinária completa",
  "phone": "(11) 3456-7890",
  "email": "contato@petcare.com.br",
  "address": "Rua das Flores, 123",
  "responsiblePersonId": "uuid-da-person"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `name` | string | Sim | Mínimo 2 caracteres |
| `type` | `"COMPANY"` \| `"NGO"` | Sim | Enum exato |
| `cnpj` | string | Condicional | Obrigatório para COMPANY; opcional para NGO; aceita formatado ou só dígitos |
| `description` | string | Não | Livre |
| `phone` | string | Não | Livre |
| `email` | string | Não | Formato e-mail válido |
| `address` | string | Não | Livre |
| `responsiblePersonId` | UUID | Sim | Deve referenciar uma Person existente |

**Regras de negócio:**
1. `responsiblePersonId` deve referenciar uma Person existente — retorna `404 Pessoa responsável` se não encontrada
2. CNPJ é sanitizado (apenas dígitos) antes da validação
3. CNPJ deve passar no algoritmo de dígito verificador — retorna `INVALID_CNPJ` (400)
4. CNPJ deve ser único — retorna `CNPJ_ALREADY_IN_USE` (409)
5. `type === "COMPANY"` sem CNPJ → retorna `CNPJ_REQUIRED` (400)
6. CNPJ é armazenado como 14 dígitos (sem formatação)

**Regra ao remover pessoa responsável:**
- A organização deve ter sempre ao menos 1 pessoa responsável
- Tentativa de remover a última pessoa retorna `CANNOT_REMOVE_LAST_PERSON` (409)

**Atualização — `PATCH /api/v1/organizations/:id`:**
```json
{
  "name": "Novo Nome",
  "description": null,
  "phone": "(11) 9999-8888",
  "email": null,
  "address": "Nova Rua, 456"
}
```
`type` e `cnpj` são imutáveis após a criação. Use `null` para limpar campos opcionais.

---

## 4. Pet (Módulo `pet`)

### O que é
Animal cadastrado no sistema. Todo pet tem exatamente **1 tutor primário** (ativo) e zero ou mais co-tutores.
O tutor primário pode ser uma Person ou uma Organization.

### Tipos de tutoria primária

| Tipo | Descrição |
|---|---|
| `OWNER` | Proprietário do pet |
| `TUTOR` | Tutela (ex.: adotou responsabilidade, mas não é dono original) |
| `TEMPORARY_HOME` | Lar temporário (ex.: ONG ou foster) |

### Pré-requisito para criação via API autenticada
O usuário autenticado deve ter um perfil **Person** criado. O pet é vinculado ao Person do usuário automaticamente.

### Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/pets` | **Sim** | Lista pets do usuário autenticado |
| `POST` | `/api/v1/pets` | **Sim** | Cria pet (tutor = Person do usuário) |
| `GET` | `/api/v1/pets/:id` | **Sim** | Busca pet por ID |
| `PATCH` | `/api/v1/pets/:id` | **Sim** | Atualiza dados do pet |
| `DELETE` | `/api/v1/pets/:id` | **Sim** | Remove o pet |
| `POST` | `/api/v1/pets/:id/transfer-tutorship` | **Sim** | Transfere tutoria primária |
| `GET` | `/api/v1/pets/:id/tutorship-history` | **Sim** | Histórico de tutorias |
| `POST` | `/api/v1/pets/:id/co-tutors` | **Sim** | Adiciona co-tutor |
| `DELETE` | `/api/v1/pets/:id/co-tutors/:coTutorId` | **Sim** | Remove co-tutor |

### Criação — `POST /api/v1/pets`

**Body:**
```json
{
  "name": "Rex",
  "species": "Cão",
  "breed": "Golden Retriever",
  "gender": "M",
  "birthDate": "2022-05-15",
  "microchip": "985121234567890",
  "notes": "Brincalhão e dócil",
  "tutorshipType": "OWNER"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `name` | string | Sim | Mínimo 1 caractere |
| `species` | string | Sim | Mínimo 1 caractere (ex: "Cão", "Gato", "Ave") |
| `breed` | string | Não | Livre |
| `gender` | string | Não | Livre (ex: "M", "F") |
| `birthDate` | date string | Não | Formato ISO 8601 (ex: "2022-05-15") |
| `microchip` | string | Não | Deve ser único no sistema |
| `notes` | string | Não | Livre |
| `tutorshipType` | `"OWNER"` \| `"TUTOR"` \| `"TEMPORARY_HOME"` | Não | Default: `"OWNER"` |

**Regras de negócio:**
1. O tutor do pet é **sempre** a Person do usuário autenticado (extraída do JWT)
2. Se o usuário não tiver Person criada → retorna `404 Perfil de pessoa do usuário`
3. `tutorshipType` define a natureza da relação (default: `OWNER`)
4. Ao criar, é criado automaticamente 1 registro `Tutorship` com `active: true`
5. O campo `primaryTutorId` **não** existe no body da request — é derivado automaticamente

### Transferência de Tutoria — `POST /api/v1/pets/:id/transfer-tutorship`

**Body (para Person):**
```json
{
  "tutorType": "PERSON",
  "personCpf": "529.982.247-25",
  "tutorshipType": "OWNER",
  "transferNotes": "Transferido por mudança de cidade"
}
```

**Body (para Organization):**
```json
{
  "tutorType": "ORGANIZATION",
  "orgTutorId": "uuid-da-organization",
  "tutorshipType": "TEMPORARY_HOME"
}
```

**Regras de negócio:**
1. O novo tutor Person é identificado pelo **CPF** (não por UUID)
2. O sistema busca a Person pelo CPF e resolve o ID internamente
3. O CPF deve existir no sistema — retorna `404 Tutor` se não encontrado
4. O tutorship atual é desativado (`active: false`, `endDate: now`)
5. Um novo tutorship é criado com `active: true`
6. Todo o histórico é preservado na tabela `tutorships`

### Co-tutores — `POST /api/v1/pets/:id/co-tutors`

**Body (para Person):**
```json
{
  "tutorType": "PERSON",
  "personCpf": "123.456.789-09"
}
```

**Regras de negócio:**
1. Co-tutor Person também é identificado pelo **CPF**
2. O co-tutor não pode ser o mesmo que o tutor primário ativo — retorna `TUTOR_CONFLICT` (409)
3. Um pet não pode ter dois co-tutores iguais (constraint único no banco)
4. Co-tutores são independentes da tutoria primária

---

## Códigos de Erro Padrão

| Código HTTP | Código de Erro | Quando ocorre |
|---|---|---|
| 400 | `INVALID_CPF` | CPF não passa na validação de dígito verificador |
| 400 | `INVALID_CNPJ` | CNPJ não passa na validação de dígito verificador |
| 400 | `CNPJ_REQUIRED` | COMPANY criada sem CNPJ |
| 400 | `TUTOR_REQUIRED` | Pet criado sem tutor válido |
| 400 | `INVALID_VERIFICATION_TOKEN` | Token de verificação não encontrado |
| 400 | `VERIFICATION_TOKEN_EXPIRED` | Token de verificação expirado |
| 400 | `INVALID_RESET_TOKEN` | Token de reset não encontrado |
| 400 | `RESET_TOKEN_EXPIRED` | Token de reset expirado |
| 401 | — | Credenciais inválidas ou token ausente/expirado |
| 403 | `EMAIL_NOT_VERIFIED` | Login antes de verificar e-mail |
| 404 | — | Entidade não encontrada |
| 409 | `EMAIL_ALREADY_IN_USE` | E-mail já cadastrado |
| 409 | `CPF_ALREADY_IN_USE` | CPF já cadastrado |
| 409 | `CNPJ_ALREADY_IN_USE` | CNPJ já cadastrado |
| 409 | `PROFILE_ALREADY_EXISTS` | User já tem um perfil Person |
| 409 | `CANNOT_REMOVE_LAST_PERSON` | Tentativa de remover última pessoa da org |
| 409 | `TUTOR_CONFLICT` | Co-tutor igual ao tutor primário |

**Envelope de erro:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CPF",
    "message": "O CPF informado não é válido."
  }
}
```

---

## Relacionamentos Entre Entidades

```
User (1) ──────── (0..1) Person
                          │
                          ├── (0..N) Tutorship (tutor primário de pets)
                          ├── (0..N) CoTutor (co-tutor de pets)
                          └── (0..N) OrganizationPerson (responsável por orgs)

Organization (1) ──── (1..N) OrganizationPerson
                          │
                          ├── (0..N) Tutorship (tutor primário de pets)
                          └── (0..N) CoTutor (co-tutor de pets)

Pet (1) ──── (1) Tutorship ativo
         ├── (0..N) Tutorship histórico
         └── (0..N) CoTutor
```

---

## Notas de CPF e CNPJ

- **CPF válido para testes:** `529.982.247-25` / `52998224725`
- **CNPJ válido para testes:** `11.222.333/0001-81` / `11222333000181`
- Ambos os documentos aceitam entrada formatada (com máscara) ou apenas dígitos
- Armazenados sempre como dígitos puros no banco: CPF = 11 dígitos, CNPJ = 14 dígitos
- Validação implementada em `src/shared/validators/cpf.validator.ts` e `cnpj.validator.ts`
