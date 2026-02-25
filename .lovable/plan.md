
# Correcao: IA Detectora nao risca itens do script

## Diagnostico Real

O usuario falou exatamente o texto que consta no script de qualificacao, mas a IA detectora retornou todos os arrays vazios. Analisando o codigo:

1. **Modelo de IA inadequado**: O `script-checker` usa `google/gemini-2.5-flash-lite`, descrito como "Fastest + cheapest. **Weakest on nuance and complex reasoning**". Este modelo e fraco demais para deteccao confiavel de itens em transcricoes. Precisa ser atualizado para `google/gemini-2.5-flash` (equilibrio entre custo/velocidade e qualidade).

2. **Sem log do transcript enviado**: Nao ha nenhum `console.log` do conteudo da transcricao recebida no backend, tornando impossivel saber se o texto do SDR chegou corretamente.

3. **Filtro de alucinacoes incompleto**: Expressoes como "que e o?" do canal Lead poluem o transcript com dezenas de linhas inuteis, dificultando a deteccao mesmo com um modelo melhor.

## Mudancas tecnicas

### 1. MODIFICAR `supabase/functions/script-checker/index.ts`

- **Trocar modelo**: de `google/gemini-2.5-flash-lite` para `google/gemini-2.5-flash` (melhor deteccao, latencia aceitavel)
- **Adicionar log do transcript**: `console.log` dos primeiros 300 caracteres da transcricao recebida para debug
- **Adicionar validacao minima**: se a transcricao tiver menos de 20 caracteres uteis, retornar arrays vazios sem chamar a IA

### 2. MODIFICAR `src/components/crm/RealtimeCoachingPanel.tsx`

- **Expandir `hallucinationPatterns`** com novos padroes de silencio:
  - `/^que\s+[ée]\s+o\??$/i` -- "que e o?", "que e o"
  - `/^o\s+qu[ée]\??$/i` -- "o que?", "o que?"  
  - `/^\.+$/` -- so pontuacao
  - `/^[\s\W]{0,5}$/` -- textos quase vazios
- **Adicionar filtro de texto curto**: menos de 2 palavras significativas = provavel alucinacao
- **Adicionar `console.log` de diagnostico**: logar tamanho e resumo da transcricao antes de enviar ao script-checker

### Arquivos a modificar

1. `supabase/functions/script-checker/index.ts` -- upgrade do modelo + log + validacao
2. `src/components/crm/RealtimeCoachingPanel.tsx` -- filtros de alucinacao + logs
