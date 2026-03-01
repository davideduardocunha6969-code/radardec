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
import PromptsModelador from "./pages/PromptsModelador";
import TiposProdutos from "./pages/TiposProdutos";
import MidiaSocial from "./pages/MidiaSocial";
import ContentHub from "./pages/ContentHub";
import ModeladorConteudo from "./pages/ModeladorConteudo";
import ModeladorReplica from "./pages/ModeladorReplica";
import AtividadesMarketing from "./pages/AtividadesMarketing";
import AtendimentosClosers from "./pages/AtendimentosClosers";
import CrmOutbound from "./pages/CrmOutbound";
import CrmFunilKanban from "./pages/CrmFunilKanban";
import RadarOutbound from "./pages/RadarOutbound";
 import PerfilIA from "./pages/PerfilIA";
 import RobosCoach from "./pages/RobosCoach";
 import RecrutamentoLayout from "./pages/recrutamento";
 import Vagas from "./pages/recrutamento/Vagas";
 import BancoTalentos from "./pages/recrutamento/BancoTalentos";
 import TriagemIA from "./pages/recrutamento/TriagemIA";
 import Pipeline from "./pages/recrutamento/Pipeline";
 import Relatorios from "./pages/recrutamento/Relatorios";
 import SugestoesContratacao from "./pages/recrutamento/SugestoesContratacao";
 import NotFound from "./pages/NotFound";
 import Agenda from "./pages/Agenda";
 import MeuPainel from "./pages/MeuPainel";
 import Atendimento from "./pages/Atendimento";
 import Configuracoes from "./pages/Configuracoes";
 import AtendimentoAguardando from "./pages/AtendimentoAguardando";
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
            <Route path="/atendimento" element={<Atendimento />} />
            <Route path="/atendimento-aguardando" element={<AtendimentoAguardando />} />
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<ProtectedRoute pageKey="gestao-geral"><GestaoGeral /></ProtectedRoute>} />
              <Route path="/radar-controladoria" element={<ProtectedRoute pageKey="radar-controladoria"><RadarControladoria /></ProtectedRoute>} />
              <Route path="/radar-comercial" element={<ProtectedRoute pageKey="radar-comercial"><RadarComercial /></ProtectedRoute>} />
              <Route path="/radar-bancario" element={<ProtectedRoute pageKey="radar-bancario"><RadarBancario /></ProtectedRoute>} />
              <Route path="/radar-previdenciario" element={<ProtectedRoute pageKey="radar-previdenciario"><RadarPrevidenciario /></ProtectedRoute>} />
              <Route path="/radar-trabalhista" element={<ProtectedRoute pageKey="radar-trabalhista"><RadarTrabalhista /></ProtectedRoute>} />
              <Route path="/comercial/atendimentos" element={<ProtectedRoute pageKey="comercial-atendimentos"><AtendimentosClosers /></ProtectedRoute>} />
              <Route path="/radar-outbound" element={<ProtectedRoute pageKey="radar-outbound"><RadarOutbound /></ProtectedRoute>} />
              <Route path="/crm-outbound" element={<ProtectedRoute pageKey="crm-outbound"><CrmOutbound /></ProtectedRoute>} />
              <Route path="/crm-outbound/:funilId" element={<ProtectedRoute pageKey="crm-outbound"><CrmFunilKanban /></ProtectedRoute>} />
              <Route path="/robos/perfil-ia" element={<ProtectedRoute pageKey="robos-perfil-ia"><PerfilIA /></ProtectedRoute>} />
              <Route path="/robos/coach" element={<ProtectedRoute pageKey="robos-coach"><RobosCoach /></ProtectedRoute>} />
              <Route path="/robos/transcricao" element={<ProtectedRoute pageKey="robos-transcricao"><Transcricao /></ProtectedRoute>} />
              <Route path="/robos/prompts" element={<ProtectedRoute pageKey="robos-prompts"><AiPrompts /></ProtectedRoute>} />
              <Route path="/robos/prompts-modelador" element={<ProtectedRoute pageKey="robos-prompts-modelador"><PromptsModelador /></ProtectedRoute>} />
              <Route path="/robos/modelador-replica" element={<ProtectedRoute pageKey="robos-modelador-replica"><ModeladorReplica /></ProtectedRoute>} />
              <Route path="/robos/produtos" element={<ProtectedRoute pageKey="robos-produtos"><TiposProdutos /></ProtectedRoute>} />
              <Route path="/content-hub" element={<ProtectedRoute pageKey="content-hub"><ContentHub /></ProtectedRoute>} />
              <Route path="/midia-social" element={<ProtectedRoute pageKey="midia-social"><MidiaSocial /></ProtectedRoute>} />
              <Route path="/marketing/modelador" element={<ProtectedRoute pageKey="marketing-modelador"><ModeladorConteudo /></ProtectedRoute>} />
              <Route path="/marketing/atividades" element={<ProtectedRoute pageKey="marketing-atividades"><AtividadesMarketing /></ProtectedRoute>} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/meu-painel" element={<MeuPainel />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/admin" element={<Admin />} />
               {/* Recrutamento Inteligente */}
               <Route path="/recrutamento" element={<ProtectedRoute pageKey="recrutamento"><RecrutamentoLayout /></ProtectedRoute>}>
                 <Route index element={<Vagas />} />
                 <Route path="vagas" element={<Vagas />} />
                 <Route path="banco-talentos" element={<BancoTalentos />} />
                 <Route path="triagem-ia" element={<TriagemIA />} />
                 <Route path="pipeline" element={<Pipeline />} />
                 <Route path="relatorios" element={<Relatorios />} />
                <Route path="sugestoes" element={<SugestoesContratacao />} />
               </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
