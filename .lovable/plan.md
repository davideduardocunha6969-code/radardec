

## Plan: Add "Reels Machine" to Marketing sidebar

### Overview
Add a new "Reels Machine" sub-item under Marketing in the sidebar, with a full page containing 4 internal tabs (Dashboard, Novo Projeto, Galeria, Configurações) using mock data. Follows existing patterns exactly.

### Files to Create

**1. `src/pages/ReelsMachine.tsx`** — Main page with 4 tabs:
- **Dashboard tab**: 4 summary cards (Vídeos Hoje, Renderizando, Prontos para Publicar, Publicados) + table of recent projects with status badges
- **Novo Projeto tab**: Project name input, 3 file upload zones (Hooks multi, Corpo single, CTAs multi) using react-dropzone, live variation counter ("X hooks × 1 corpo × Y CTAs = Z variações"), disabled "Gerar Variações" button until all 3 have files
- **Galeria tab**: Grid of video variation cards with thumbnail placeholder, name, status badge (Pendente/Renderizando/Pronto/Publicado), "Publicar" button on Pronto cards, status filter at top
- **Configurações tab**: Creatomate API Key input, dynamic list of Instagram pages (nome, user ID, access token), add/save buttons

### Files to Modify

**2. `src/components/AppSidebar.tsx`**:
- Add `{ title: "Reels Machine", url: "/marketing/reels-machine", icon: Flame, pageKey: "marketing-reels-machine" }` to `marketingItems` array
- Update `isAnyMarketingActive` to also match this new route

**3. `src/App.tsx`**:
- Import `ReelsMachine` page
- Add route: `<Route path="/marketing/reels-machine" element={<ProtectedRoute pageKey="marketing-reels-machine"><ReelsMachine /></ProtectedRoute>} />`

### UI Details
- Uses existing components: `Card`, `Tabs`, `Table`, `Input`, `Button`, `Badge`, `Select`
- File uploads via `react-dropzone` (already installed)
- Mock data: 5 sample projects, 12 sample variations
- Same visual style as existing pages (dark header, card grid, consistent spacing)

