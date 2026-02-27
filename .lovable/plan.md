

# Mover chamada de SDR para Closer

## Problema
A chamada com ID `cefd1463-a199-43b9-b29e-e8e9e910aac8` (25/02/26 17:26, WhatsApp, 21988801469, 18m46s, nota 8/10, R$9.61) esta registrada como `papel = 'sdr'` mas foi feita por um Closer.

## Correcao

Executar um UPDATE simples para alterar o campo `papel` de `'sdr'` para `'closer'`:

```sql
UPDATE crm_chamadas 
SET papel = 'closer' 
WHERE id = 'cefd1463-a199-43b9-b29e-e8e9e910aac8';
```

## Resultado

- O registro desaparecera da aba "Contatos SDR"
- O registro aparecera na aba "Atendimento Closer" (na secao de historico de contatos que acabamos de criar)
- Nenhuma outra alteracao necessaria

## Arquivos modificados

Nenhum arquivo de codigo sera alterado. Apenas um UPDATE de dados no banco.
