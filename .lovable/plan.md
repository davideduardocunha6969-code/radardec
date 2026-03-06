

# Suporte a TikTok na Edge Function `analyze-instagram-video`

## Resumo

Substituir a função `extractInstagramMedia` por uma nova função `extractSocialMedia` que:
1. Detecta a rede (Instagram ou TikTok) pelo hostname do link
2. Usa a API `social-media-video-downloader.p.rapidapi.com` com rotas específicas por rede
3. Normaliza o retorno para a mesma interface `InstagramMediaResponse` existente

## Alterações — apenas em `supabase/functions/analyze-instagram-video/index.ts`

### 1. Função de detecção de rede
```typescript
function detectPlatform(url: string): "instagram" | "tiktok" {
  const host = new URL(url).hostname;
  if (host.includes("tiktok")) return "tiktok";
  return "instagram";
}
```

### 2. Substituir `extractInstagramMedia` por `extractSocialMedia`

- Usa `detectPlatform(url)` para escolher a rota:
  - Instagram: `GET /instagram/v2/post/details?url={url}`
  - TikTok: `GET /tiktok/v3/post/details?url={url}`
- Header: `x-rapidapi-host: social-media-video-downloader.p.rapidapi.com`
- Parseia a resposta de cada rede para extrair `video_url`, `thumbnail_url`, `caption`, `username`, `like_count`, `comment_count`, `view_count`

### 3. Atualizar chamadas

- Trocar `extractInstagramMedia(link)` → `extractSocialMedia(link)` nas duas ocorrências (action `extract` e fluxo principal)
- Atualizar logs de `"Instagram"` para `"social media"` onde aplicável
- Atualizar mensagem de erro de "Instagram" para "Instagram/TikTok"
- Atualizar o prompt de `generateContentModeling` de "vídeo do Instagram" para "vídeo de rede social"

### 4. Remover código morto

- Remover `normalizeInstagramUrl` (não necessária com a nova API)
- Remover `extractVideoFrames` (nunca usada)

Nenhuma outra parte da função muda — transcrição, análise visual e geração de conteúdo permanecem iguais.

