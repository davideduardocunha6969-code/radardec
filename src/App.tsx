import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import GestaoGeral from "./pages/GestaoGeral";
import RadarControladoria from "./pages/RadarControladoria";
import RadarComercial from "./pages/RadarComercial";
import RadarBancario from "./pages/RadarBancario";
import RadarPrevidenciario from "./pages/RadarPrevidenciario";
import RadarTrabalhista from "./pages/RadarTrabalhista";
import Transcricao from "./pages/Transcricao";
import AiPrompts from "./pages/AiPrompts";
import TiposProdutos from "./pages/TiposProdutos";
import MidiaSocial from "./pages/MidiaSocial";
import ContentHub from "./pages/ContentHub";
import ModeladorConteudo from "./pages/ModeladorConteudo";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<ProtectedRoute pageKey="gestao-geral"><GestaoGeral /></ProtectedRoute>} />
              <Route path="/radar-controladoria" element={<ProtectedRoute pageKey="radar-controladoria"><RadarControladoria /></ProtectedRoute>} />
              <Route path="/radar-comercial" element={<ProtectedRoute pageKey="radar-comercial"><RadarComercial /></ProtectedRoute>} />
              <Route path="/radar-bancario" element={<ProtectedRoute pageKey="radar-bancario"><RadarBancario /></ProtectedRoute>} />
              <Route path="/radar-previdenciario" element={<ProtectedRoute pageKey="radar-previdenciario"><RadarPrevidenciario /></ProtectedRoute>} />
              <Route path="/radar-trabalhista" element={<ProtectedRoute pageKey="radar-trabalhista"><RadarTrabalhista /></ProtectedRoute>} />
              <Route path="/robos/transcricao" element={<ProtectedRoute pageKey="robos-transcricao"><Transcricao /></ProtectedRoute>} />
              <Route path="/robos/prompts" element={<ProtectedRoute pageKey="robos-prompts"><AiPrompts /></ProtectedRoute>} />
              <Route path="/robos/produtos" element={<ProtectedRoute pageKey="robos-produtos"><TiposProdutos /></ProtectedRoute>} />
              <Route path="/content-hub" element={<ProtectedRoute pageKey="content-hub"><ContentHub /></ProtectedRoute>} />
              <Route path="/midia-social" element={<ProtectedRoute pageKey="midia-social"><MidiaSocial /></ProtectedRoute>} />
              <Route path="/marketing/modelador" element={<ProtectedRoute pageKey="marketing-modelador"><ModeladorConteudo /></ProtectedRoute>} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
