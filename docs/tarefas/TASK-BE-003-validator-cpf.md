# TASK-BE-003 — Validator de CPF

## Informações
| Campo        | Valor |
|--------------|-------|
| ID           | TASK-BE-003 |
| Módulo       | shared/validators |
| Prioridade   | Alta |
| Dependências | TASK-BE-001 |
| Status       | Pendente |

## Objetivo
Implementar e testar o algoritmo de validação de CPF brasileiro com cobertura completa de casos de borda.

## Contexto
CPF é obrigatório para cadastro de Person. O algoritmo de dígito verificador do CPF é público e bem definido. Casos inválidos conhecidos: CPFs com todos os dígitos iguais (ex.: 111.111.111-11) são considerados inválidos mesmo que passem no cálculo.

## Checklist

### Pré-requisitos
- [ ] TASK-BE-001 concluída

### Red — Testes falhando primeiro
- [ ] Criar `src/shared/validators/__tests__/cpf.validator.test.ts`
- [ ] Escrever teste: CPF válido formatado (`000.000.000-00`) → `true`
- [ ] Escrever teste: CPF válido sem formatação (só dígitos) → `true`
- [ ] Escrever teste: CPF com todos dígitos iguais (`111.111.111-11`) → `false`
- [ ] Escrever teste: CPF com menos de 11 dígitos → `false`
- [ ] Escrever teste: CPF com mais de 11 dígitos → `false`
- [ ] Escrever teste: CPF com letras → `false`
- [ ] Escrever teste: string vazia → `false`
- [ ] Escrever teste: CPF com dígito verificador errado → `false`
- [ ] Escrever teste: função `sanitizeCpf` remove pontos e traço
- [ ] Confirmar que todos os testes falham

### Green — Implementação mínima
- [ ] Criar `src/shared/validators/cpf.validator.ts`
- [ ] Implementar `sanitizeCpf(cpf: string): string` — remove formatação
- [ ] Implementar `validateCpf(cpf: string): boolean` — algoritmo completo de dígito verificador
- [ ] Confirmar que todos os testes passam

### Refactor
- [ ] Extrair constante para lista de CPFs inválidos conhecidos (todos dígitos iguais)
- [ ] Garantir que a função é pura (sem side effects)

### Finalização
- [ ] Todos os testes passando
- [ ] Coverage 100% neste arquivo
- [ ] PR aberto com descrição

## Arquivos a Criar / Modificar

| Ação  | Arquivo |
|-------|---------|
| Criar | `src/shared/validators/cpf.validator.ts` |
| Criar | `src/shared/validators/__tests__/cpf.validator.test.ts` |

## Critérios de Aceite
- [ ] CPFs válidos retornam `true` com e sem formatação
- [ ] CPFs com todos os dígitos iguais retornam `false`
- [ ] CPFs com dígito verificador inválido retornam `false`
- [ ] `sanitizeCpf` retorna apenas os 11 dígitos numéricos
- [ ] Coverage 100%
