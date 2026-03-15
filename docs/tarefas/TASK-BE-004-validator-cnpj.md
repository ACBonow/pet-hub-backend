# TASK-BE-004 — Validator de CNPJ

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-004 |
| Módulo       | shared/validators |
| Prioridade   | Alta |
| Dependências | TASK-BE-001 |
| Status       | Pendente |

## Objetivo
Implementar e testar o algoritmo de validação de CNPJ brasileiro com cobertura completa de casos de borda.

## Contexto
CNPJ é obrigatório para empresas e opcional para ONGs. O algoritmo de dígito verificador do CNPJ usa pesos diferentes do CPF. CNPJs com todos os dígitos iguais são inválidos. Deve aceitar CNPJ formatado (`00.000.000/0000-00`) e sem formatação.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-001 concluída

### Red — Testes falhando primeiro
- [ ] Criar `src/shared/validators/__tests__/cnpj.validator.test.ts`
- [ ] Escrever teste: CNPJ válido formatado → `true`
- [ ] Escrever teste: CNPJ válido sem formatação → `true`
- [ ] Escrever teste: CNPJ com todos dígitos iguais (`11.111.111/1111-11`) → `false`
- [ ] Escrever teste: CNPJ com menos de 14 dígitos → `false`
- [ ] Escrever teste: CNPJ com mais de 14 dígitos → `false`
- [ ] Escrever teste: CNPJ com letras → `false`
- [ ] Escrever teste: string vazia → `false`
- [ ] Escrever teste: CNPJ com dígito verificador errado → `false`
- [ ] Escrever teste: função `sanitizeCnpj` remove pontos, barra e traço
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar `src/shared/validators/cnpj.validator.ts`
- [ ] Implementar `sanitizeCnpj(cnpj: string): string`
- [ ] Implementar `validateCnpj(cnpj: string): boolean`
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Extrair constante para CNPJs inválidos conhecidos
- [ ] Garantir função pura

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage 100% neste arquivo
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação  | Arquivo |
|-------|---------|
| Criar | `src/shared/validators/cnpj.validator.ts` |
| Criar | `src/shared/validators/__tests__/cnpj.validator.test.ts` |

## Critérios de Aceite
- [ ] CNPJs válidos retornam `true` com e sem formatação
- [ ] CNPJs com todos os dígitos iguais retornam `false`
- [ ] CNPJs com dígito verificador inválido retornam `false`
- [ ] `sanitizeCnpj` retorna apenas os 14 dígitos numéricos
- [ ] Coverage 100%
