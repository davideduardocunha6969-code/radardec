 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 // Types
 export type VagaStatus = "aberta" | "em_analise" | "encerrada";
 export type TipoContrato = "clt" | "pj" | "estagio";
 export type Modalidade = "presencial" | "hibrido" | "remoto";
 export type Senioridade = "junior" | "pleno" | "senior";
 export type CandidatoStatus = "triagem_ia" | "entrevista_rh" | "entrevista_tecnica" | "proposta" | "contratado" | "reprovado" | "banco_talentos";
 
 export interface Vaga {
   id: string;
   titulo: string;
   setor: string;
   tipo_contrato: TipoContrato;
   modalidade: Modalidade;
   senioridade: Senioridade;
   salario_min?: number;
   salario_max?: number;
   descricao?: string;
   responsabilidades?: string;
   hard_skills_obrigatorias?: string[];
   hard_skills_desejaveis?: string[];
   soft_skills?: string[];
   experiencia_minima_anos: number;
   formacao_minima?: string;
   peso_experiencia: number;
   peso_soft_skills: number;
   peso_formacao: number;
   peso_cursos: number;
   peso_fit_cultural: number;
   status: VagaStatus;
   user_id: string;
   created_at: string;
   updated_at: string;
 }
 
 export interface Candidato {
   id: string;
   nome: string;
   email: string;
   telefone?: string;
   linkedin_url?: string;
   resumo?: string;
   experiencia_total_anos: number;
   ultimo_cargo?: string;
   formacao?: string;
   skills_detectadas?: string[];
   cursos_extras?: string[];
   idiomas?: string[];
   dados_extraidos?: Record<string, any>;
   user_id: string;
   created_at: string;
   updated_at: string;
 }
 
 export interface Curriculo {
   id: string;
   candidato_id: string;
   arquivo_nome: string;
   arquivo_url: string;
   arquivo_tipo?: string;
   texto_extraido?: string;
   processado: boolean;
   erro_processamento?: string;
   user_id: string;
   created_at: string;
 }
 
 export interface CandidatoVaga {
   id: string;
   candidato_id: string;
   vaga_id: string;
   curriculo_id?: string;
   score_total: number;
   score_detalhado?: Record<string, any>;
   explicacao_score?: string;
   status: CandidatoStatus;
   ordem: number;
   notas?: string;
   enviar_email_automatico: boolean;
   user_id: string;
   created_at: string;
   updated_at: string;
   candidato?: Candidato;
   curriculo?: Curriculo;
 }
 
 export interface AnalisesCurriculo {
   id: string;
   curriculo_id: string;
   vaga_id: string;
   prompt_usado?: string;
   resposta_ia?: Record<string, any>;
   score_calculado?: number;
   match_skills?: Record<string, any>;
   match_experiencia?: Record<string, any>;
   match_formacao?: Record<string, any>;
   pontos_fortes?: string[];
   pontos_fracos?: string[];
   recomendacao?: string;
   processado_em?: string;
   user_id: string;
   created_at: string;
 }
 
 // Vagas hooks
 export function useVagas(status?: VagaStatus) {
   return useQuery({
     queryKey: ["vagas-recrutamento", status],
     queryFn: async () => {
       let query = supabase
         .from("vagas_recrutamento")
         .select("*")
         .order("created_at", { ascending: false });
       
       if (status) {
         query = query.eq("status", status);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as Vaga[];
     },
   });
 }
 
 export function useVaga(id: string | null) {
   return useQuery({
     queryKey: ["vaga-recrutamento", id],
     queryFn: async () => {
       if (!id) return null;
       const { data, error } = await supabase
         .from("vagas_recrutamento")
         .select("*")
         .eq("id", id)
         .single();
       if (error) throw error;
       return data as Vaga;
     },
     enabled: !!id,
   });
 }
 
 export function useCreateVaga() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (vaga: Omit<Vaga, "id" | "created_at" | "updated_at">) => {
       const { data, error } = await supabase
         .from("vagas_recrutamento")
         .insert(vaga)
         .select()
         .single();
       if (error) throw error;
       
       // Trigger reprocessing of all existing candidates for the new vaga
       // This is done asynchronously in the background
       supabase.functions.invoke("reprocess-candidatos-for-vaga", {
         body: { vagaId: data.id },
       }).then((result) => {
         if (result.data?.success) {
           console.log(`Reprocessed ${result.data.processed} candidates for new vaga`);
           queryClient.invalidateQueries({ queryKey: ["candidatos-vaga", data.id] });
         }
       }).catch((err) => {
         console.error("Error reprocessing candidates:", err);
       });
       
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vagas-recrutamento"] });
       toast({ 
         title: "Vaga criada com sucesso!", 
         description: "Os currículos do Banco de Talentos estão sendo analisados em segundo plano." 
       });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao criar vaga", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useUpdateVaga() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<Vaga> & { id: string }) => {
       const { data, error } = await supabase
         .from("vagas_recrutamento")
         .update(updates)
         .eq("id", id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["vagas-recrutamento"] });
       queryClient.invalidateQueries({ queryKey: ["vaga-recrutamento", variables.id] });
       toast({ title: "Vaga atualizada!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao atualizar vaga", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useDeleteVaga() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("vagas_recrutamento").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vagas-recrutamento"] });
       toast({ title: "Vaga excluída!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao excluir vaga", description: error.message, variant: "destructive" });
     },
   });
 }
 
 // Candidatos hooks
 export function useCandidatos(search?: string) {
   return useQuery({
     queryKey: ["candidatos", search],
     queryFn: async () => {
       let query = supabase
         .from("candidatos")
         .select("*")
         .order("created_at", { ascending: false });
       
       if (search) {
         query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,ultimo_cargo.ilike.%${search}%`);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as Candidato[];
     },
   });
 }
 
 export function useCandidato(id: string | null) {
   return useQuery({
     queryKey: ["candidato", id],
     queryFn: async () => {
       if (!id) return null;
       const { data, error } = await supabase
         .from("candidatos")
         .select("*")
         .eq("id", id)
         .single();
       if (error) throw error;
       return data as Candidato;
     },
     enabled: !!id,
   });
 }
 
 export function useCreateCandidato() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (candidato: Omit<Candidato, "id" | "created_at" | "updated_at">) => {
       const { data, error } = await supabase
         .from("candidatos")
         .insert(candidato)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["candidatos"] });
       toast({ title: "Candidato cadastrado!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao cadastrar candidato", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useUpdateCandidato() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<Candidato> & { id: string }) => {
       const { data, error } = await supabase
         .from("candidatos")
         .update(updates)
         .eq("id", id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["candidatos"] });
       queryClient.invalidateQueries({ queryKey: ["candidato", variables.id] });
       toast({ title: "Candidato atualizado!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao atualizar candidato", description: error.message, variant: "destructive" });
     },
   });
 }
 
 // Candidato x Vaga hooks
 export function useCandidatosVaga(vagaId: string | null) {
   return useQuery({
     queryKey: ["candidatos-vaga", vagaId],
     queryFn: async () => {
       if (!vagaId) return [];
       const { data, error } = await supabase
         .from("candidato_vaga")
         .select(`
           *,
           candidato:candidatos(*),
           curriculo:curriculos(*)
         `)
         .eq("vaga_id", vagaId)
         .order("score_total", { ascending: false });
       if (error) throw error;
       return data as CandidatoVaga[];
     },
     enabled: !!vagaId,
   });
 }
 
 export function useUpdateCandidatoVaga() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, vagaId, ...updates }: Partial<CandidatoVaga> & { id: string; vagaId?: string }) => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) throw new Error("Usuário não autenticado");
 
       // Get current status before update
       const { data: current } = await supabase
         .from("candidato_vaga")
         .select("status")
         .eq("id", id)
         .single();
 
       const { data, error } = await supabase
         .from("candidato_vaga")
         .update(updates)
         .eq("id", id)
         .select()
         .single();
       if (error) throw error;
 
       // Record history if status changed
       if (updates.status && current && current.status !== updates.status) {
         await supabase.from("historico_candidato").insert({
           candidato_vaga_id: id,
           status_anterior: current.status,
           status_novo: updates.status,
           user_id: user.user.id,
         });
       }
 
       return data;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["candidatos-vaga", variables.vagaId] });
       queryClient.invalidateQueries({ queryKey: ["pipeline-recrutamento"] });
       toast({ title: "Status atualizado!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
     },
   });
 }
 
 // Pipeline hooks
 export function usePipelineVaga(vagaId: string | null) {
   return useQuery({
     queryKey: ["pipeline-recrutamento", vagaId],
     queryFn: async () => {
       if (!vagaId) return {};
       const { data, error } = await supabase
         .from("candidato_vaga")
         .select(`
           *,
           candidato:candidatos(*)
         `)
         .eq("vaga_id", vagaId)
         .order("ordem", { ascending: true });
       if (error) throw error;
 
       // Group by status
       const grouped: Record<CandidatoStatus, CandidatoVaga[]> = {
         triagem_ia: [],
         entrevista_rh: [],
         entrevista_tecnica: [],
         proposta: [],
         contratado: [],
         reprovado: [],
         banco_talentos: [],
       };
 
       (data as CandidatoVaga[]).forEach((item) => {
         grouped[item.status].push(item);
       });
 
       return grouped;
     },
     enabled: !!vagaId,
   });
 }
 
 // Estatísticas
 export function useRecrutamentoStats() {
   return useQuery({
     queryKey: ["recrutamento-stats"],
     queryFn: async () => {
       const [vagasRes, candidatosRes, contratadosRes] = await Promise.all([
         supabase.from("vagas_recrutamento").select("id, status"),
         supabase.from("candidatos").select("id"),
         supabase.from("candidato_vaga").select("id").eq("status", "contratado"),
       ]);
 
       const vagas = vagasRes.data || [];
       const vagasAbertas = vagas.filter((v) => v.status === "aberta").length;
       const vagasEmAnalise = vagas.filter((v) => v.status === "em_analise").length;
       const vagasEncerradas = vagas.filter((v) => v.status === "encerrada").length;
 
       return {
         totalVagas: vagas.length,
         vagasAbertas,
         vagasEmAnalise,
         vagasEncerradas,
         totalCandidatos: candidatosRes.data?.length || 0,
         totalContratados: contratadosRes.data?.length || 0,
       };
     },
   });
 }