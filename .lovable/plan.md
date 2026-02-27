
# Ajustes nos Paineis Laterais do Atendimento

## 4 Correções

### 1. Fechar painel ao clicar fora
Adicionar um backdrop invisivel (overlay transparente) atras do painel quando aberto. Ao clicar nele, `setActivePanel(null)`. Isso fecha o painel ao clicar em qualquer area fora dele e fora da barra de icones.

### 2. Remover cards do CrmFunilKanban
No arquivo `src/pages/CrmFunilKanban.tsx`, remover:
- Imports de `GapsPanel`, `DataExtractorPanel`, `ValuesEstimationPanel` (linhas 25-27)
- O bloco de grid com os 3 paineis (linhas 669-674)

### 3. Remover faixa branca da barra de icones
A barra de icones atual tem `bg-card border border-border rounded-l-lg shadow-lg p-1` — isso cria o fundo branco visivel na imagem. Trocar para um estilo transparente/minimalista: remover `bg-card`, `border`, `shadow-lg`. Os icones ficarao flutuando diretamente sobre o conteudo, sem caixa branca.

### 4. Melhorar visual dos icones
Os icones estao com `text-muted-foreground` (cinza claro) que fica quase invisivel. Trocar para:
- Estado inativo: icones com fundo semi-transparente escuro (`bg-card/80 backdrop-blur-sm shadow-md border border-border/50`) e cor `text-foreground`
- Estado ativo: manter `bg-primary text-primary-foreground`
- Aumentar tamanho dos icones de `h-5 w-5` para `h-6 w-6`
- Adicionar `rounded-full` nos botoes para visual mais limpo

## Arquivos alterados

1. `src/pages/Atendimento.tsx` — backdrop clicavel, barra de icones sem fundo, icones melhorados
2. `src/pages/CrmFunilKanban.tsx` — remover imports e grid dos 3 paineis

## Detalhes tecnicos

### Atendimento.tsx — Overlay sidebar reescrito

```text
Estrutura:
1. Backdrop (quando activePanel != null): div fixed inset-0 z-30, onClick fecha
2. Barra de icones: fixed right-2 z-50, sem bg-card, botoes individuais com bg-card/80 rounded-full shadow
3. Painel sliding: z-40, right-14 (para nao ficar atras dos icones)
```

### CrmFunilKanban.tsx — Remoção simples

Remover as 3 linhas de import e o bloco de 6 linhas do grid com os paineis.
