 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { Modalidade, Senioridade, TipoContrato } from "./useRecrutamento";
 
 export type SugestaoStatus = "pendente" | "aprovada" | "recusada";
 
 export interface SugestaoContratacao {
   id: string;
   user_id: string;
   setor: string;
   cargo: string;
   descricao?: string;
   responsabilidades?: string;
   hard_skills?: string[];
   soft_skills?: string[];
   modalidade: Modalidade;
   senioridade: Senioridade;
   tipo_contrato: TipoContrato;
   experiencia_minima_anos: number;
   formacao_minima?: string;
   salario_mensal: number;
   anuidade_oab: number;
   valor_ppr: number;
   comissoes_mensais: number;
   is_advogado: boolean;
   justificativa_contratacao: string;
   justificativa_nao_delegar: string;
   status: SugestaoStatus;
   aprovado_por?: string;
   aprovado_em?: string;
   motivo_recusa?: string;
   vaga_criada_id?: string;
   created_at: string;
   updated_at: string;
   // Joined fields
   criador?: { display_name: string };
 }
 
 export function useSugestoesContratacao(status?: SugestaoStatus) {
   return useQuery({
     queryKey: ["sugestoes-contratacao", status],
     queryFn: async () => {
      // First get suggestions
      let suggestionsQuery = supabase
         .from("sugestoes_contratacao")
        .select("*")
         .order("created_at", { ascending: false });
 
       if (status) {
        suggestionsQuery = suggestionsQuery.eq("status", status);
       }
 
      const { data: sugestoes, error } = await suggestionsQuery;
       if (error) throw error;
      
      if (!sugestoes || sugestoes.length === 0) {
        return [] as SugestaoContratacao[];
      }
      
      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(sugestoes.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      
      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      
      // Merge the data
      return sugestoes.map(s => ({
        ...s,
        criador: { display_name: profileMap.get(s.user_id) || "Desconhecido" }
      })) as unknown as SugestaoContratacao[];
     },
   });
 }
 
 export function useCreateSugestao() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (sugestao: Omit<SugestaoContratacao, "id" | "created_at" | "updated_at" | "status" | "aprovado_por" | "aprovado_em" | "motivo_recusa" | "vaga_criada_id" | "criador">) => {
       const { data, error } = await supabase
         .from("sugestoes_contratacao")
         .insert(sugestao)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sugestoes-contratacao"] });
       toast({ title: "Sugestão de contratação criada!", description: "Aguardando aprovação." });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao criar sugestão", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useApproveSugestao() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id }: { id: string }) => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) throw new Error("Usuário não autenticado");
 
       // Get the suggestion data
       const { data: sugestao, error: fetchError } = await supabase
         .from("sugestoes_contratacao")
         .select("*")
         .eq("id", id)
         .single();
       if (fetchError) throw fetchError;
 
       // Create the vaga from the suggestion
       const { data: vaga, error: vagaError } = await supabase
         .from("vagas_recrutamento")
         .insert({
           titulo: sugestao.cargo,
           setor: sugestao.setor,
           descricao: sugestao.descricao,
           responsabilidades: sugestao.responsabilidades,
           hard_skills_obrigatorias: sugestao.hard_skills,
           soft_skills: sugestao.soft_skills,
           modalidade: sugestao.modalidade,
           senioridade: sugestao.senioridade,
           tipo_contrato: sugestao.tipo_contrato,
           experiencia_minima_anos: sugestao.experiencia_minima_anos,
           formacao_minima: sugestao.formacao_minima,
           salario_min: sugestao.salario_mensal,
           salario_max: sugestao.salario_mensal,
           status: "aberta",
           user_id: user.user.id,
         })
         .select()
         .single();
       if (vagaError) throw vagaError;
 
       // Update the suggestion status
       const { error: updateError } = await supabase
         .from("sugestoes_contratacao")
         .update({
           status: "aprovada",
           aprovado_por: user.user.id,
           aprovado_em: new Date().toISOString(),
           vaga_criada_id: vaga.id,
         })
         .eq("id", id);
       if (updateError) throw updateError;
 
       // Create notification for the suggestion creator
       await supabase.from("notificacoes").insert({
         user_id: sugestao.user_id,
         titulo: "Sugestão de contratação aprovada!",
         mensagem: `Sua sugestão para o cargo de "${sugestao.cargo}" foi aprovada. O processo seletivo será iniciado.`,
         tipo: "success",
         link: `/recrutamento/vagas`,
       });
 
       // Trigger reprocessing of candidates
       supabase.functions.invoke("reprocess-candidatos-for-vaga", {
         body: { vagaId: vaga.id },
       });
 
       return { sugestao, vaga };
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sugestoes-contratacao"] });
       queryClient.invalidateQueries({ queryKey: ["vagas-recrutamento"] });
       toast({ title: "Sugestão aprovada!", description: "A vaga foi criada e o processo seletivo pode ser iniciado." });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao aprovar sugestão", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useRejectSugestao() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) throw new Error("Usuário não autenticado");
 
       // Get the suggestion to notify the creator
       const { data: sugestao, error: fetchError } = await supabase
         .from("sugestoes_contratacao")
         .select("*")
         .eq("id", id)
         .single();
       if (fetchError) throw fetchError;
 
       // Update the suggestion status
       const { error: updateError } = await supabase
         .from("sugestoes_contratacao")
         .update({
           status: "recusada",
           aprovado_por: user.user.id,
           aprovado_em: new Date().toISOString(),
           motivo_recusa: motivo,
         })
         .eq("id", id);
       if (updateError) throw updateError;
 
       // Create notification for the suggestion creator
       await supabase.from("notificacoes").insert({
         user_id: sugestao.user_id,
         titulo: "Sugestão de contratação recusada",
         mensagem: `Sua sugestão para o cargo de "${sugestao.cargo}" foi recusada. Motivo: ${motivo}`,
         tipo: "warning",
         link: `/recrutamento/sugestoes`,
       });
 
       return sugestao;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sugestoes-contratacao"] });
       toast({ title: "Sugestão recusada", description: "O coordenador foi notificado." });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao recusar sugestão", description: error.message, variant: "destructive" });
     },
   });
 }
 
 // Calculate costs helper
 export function calculateCosts(sugestao: {
   salario_mensal: number;
   anuidade_oab: number;
   valor_ppr: number;
   comissoes_mensais: number;
   is_advogado: boolean;
   tipo_contrato: TipoContrato;
 }) {
   const custoMensal = sugestao.salario_mensal + sugestao.comissoes_mensais;
   
   // Annual cost calculation
   let custoAnual = sugestao.salario_mensal * 12; // 12 months salary
   
   // Add OAB if lawyer
   if (sugestao.is_advogado) {
     custoAnual += sugestao.anuidade_oab;
   }
   
   // Add 80% of correlated costs if CLT
   if (sugestao.tipo_contrato === "clt") {
     custoAnual += sugestao.salario_mensal * 12 * 0.8; // 80% of salary for encargos
   }
   
   // Add PPR
   custoAnual += sugestao.valor_ppr;
   
   // Add projected annual commissions
   custoAnual += sugestao.comissoes_mensais * 12;
   
   return { custoMensal, custoAnual };
 }