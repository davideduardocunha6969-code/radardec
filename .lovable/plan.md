

# Barra lateral com overlay na tela de Atendimento

## Resumo

Adicionar uma barra de icones fixa no lado direito da tela de Atendimento. Ao clicar em um icone, o painel correspondente desliza **por cima** do conteudo principal (overlay), ocupando ~1/3 da largura. O conteudo principal permanece 100% da largura -- nao encolhe.

## Layout visual

```text
Estado fechado:
+------------------------------------------------------+------+
|                                                      | [E]  |
|              Conteudo principal (100%)                | [L]  |
|                                                      | [V]  |
+------------------------------------------------------+------+

Estado aberto (painel sobrepoe o conteudo):
+------------------------------------------------------+------+
|                              |  Painel overlay  | [E]  |
|              Conteudo        |  (1/3 da tela)   | [L]  |
|              (continua 100%) |  position fixed  | [V]  |
+------------------------------------------------------+------+
```

E = Extrator de Dados (FileSearch)
L = Lacunas (HelpCircle)  
V = Estimativa de Valores (Calculator)

## Comportamento

- Conteudo principal **nao muda de tamanho** -- o painel aparece por cima (overlay com sombra)
- Clicar no mesmo icone fecha o painel
- Clicar em outro icone troca o conteudo do painel
- Apenas 1 painel aberto por vez
- Animacao slide da direita para a esquerda com `transition-transform duration-300`

## Implementacao tecnica

### Arquivo alterado: `src/pages/Atendimento.tsx`

1. **Imports**: Adicionar `FileSearch`, `HelpCircle`, `Calculator` do lucide-react e os 3 componentes de painel (`GapsPanel`, `DataExtractorPanel`, `ValuesEstimationPanel`)

2. **Estado**: Adicionar `activePanel: "extrator" | "lacunas" | "estimativa" | null` (inicia `null`)

3. **Layout**: Dentro do container principal (`h-screen flex flex-col`), envolver a area de conteudo em um `relative` container:
   - O conteudo principal permanece com layout inalterado (100% da largura)
   - Adicionar uma barra de icones com `position: fixed` no canto direito (z-50, ~48px de largura, centrada verticalmente)
   - Adicionar o painel overlay com `position: fixed`, `right: 48px`, `top` abaixo do header, `bottom: 0`, `w-1/3`, com `translate-x` controlado pelo estado (translate-x-0 quando aberto, translate-x-full quando fechado)
   - O painel overlay tera `bg-background shadow-2xl border-l` para se destacar do conteudo abaixo

4. **Icones**: Cada icone tera tooltip e destaque visual (bg colorido) quando ativo. Ao clicar, alterna `activePanel`

5. **Conteudo do painel**: Renderiza condicionalmente `DataExtractorPanel`, `GapsPanel` ou `ValuesEstimationPanel` passando `leadId={lead.id}`

### Nenhum outro arquivo sera alterado

Os componentes de painel ja existem e aceitam `leadId` como prop.
