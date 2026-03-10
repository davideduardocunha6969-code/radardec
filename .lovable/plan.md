

## Correção: Filtrar apenas seção "Dados Pessoais" no ZapSign

### Problema
O Step 2 do ZapSignDialog exibe campos de TODAS as seções (Dados de contato, Dados leads bancários, Dados leads Motoristas de caminhão, etc.), quando deveria mostrar apenas os campos da seção **"Dados pessoais"** + os campos nativos (nome, endereço).

### Solução
No `useMemo` que monta o `groupedFields` (linhas 56-86 do `ZapSignDialog.tsx`), filtrar apenas a seção cujo nome contenha "dados pessoais" (case-insensitive). Remover também os campos nativos de telefone (que pertence a "Dados de contato") e manter apenas nome e endereço como campos nativos.

### Alterações

**`src/components/crm/ZapSignDialog.tsx`**
- Na construção do `secaoMap` (linha 59-61), filtrar apenas seções cujo `nome.toLowerCase()` inclua `"dados pessoais"`
- Remover o bloco que adiciona `__telefone__` como campo nativo (linhas 44-49), já que telefone não faz parte de "Dados Pessoais"
- Na coleta de valores dos campos (linhas 63-76), só processar campos que pertencem a seções filtradas
- Resultado: Step 2 mostrará apenas Nome, Endereço e os campos dinâmicos de "Dados pessoais" (CPF, estado civil, etc.)

