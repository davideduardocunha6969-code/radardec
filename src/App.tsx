import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import GestaoGeral from "./pages/GestaoGeral";
import RadarControladoria from "./pages/RadarControladoria";
import RadarComercial from "./pages/RadarComercial";
import RadarBancario from "./pages/RadarBancario";
import RadarPrevidenciario from "./pages/RadarPrevidenciario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<GestaoGeral />} />
            <Route path="/radar-controladoria" element={<RadarControladoria />} />
            <Route path="/radar-comercial" element={<RadarComercial />} />
            <Route path="/radar-bancario" element={<RadarBancario />} />
            <Route path="/radar-previdenciario" element={<RadarPrevidenciario />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
