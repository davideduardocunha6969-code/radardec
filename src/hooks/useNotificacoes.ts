 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export type NotificacaoTipo = "info" | "success" | "warning" | "error";
 
 export interface Notificacao {
   id: string;
   user_id: string;
   titulo: string;
   mensagem: string;
   tipo: NotificacaoTipo;
   link?: string;
   lida: boolean;
   enviado_email: boolean;
   created_at: string;
 }
 
 export function useNotificacoes() {
   return useQuery({
     queryKey: ["notificacoes"],
     queryFn: async () => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) return [];
 
       const { data, error } = await supabase
         .from("notificacoes")
         .select("*")
         .eq("user_id", user.user.id)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as Notificacao[];
     },
   });
 }
 
 export function useUnreadNotificacoesCount() {
   return useQuery({
     queryKey: ["notificacoes-unread-count"],
     queryFn: async () => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) return 0;
 
       const { count, error } = await supabase
         .from("notificacoes")
         .select("*", { count: "exact", head: true })
         .eq("user_id", user.user.id)
         .eq("lida", false);
       if (error) throw error;
       return count || 0;
     },
     refetchInterval: 30000, // Refetch every 30 seconds
   });
 }
 
 export function useMarkNotificacaoAsRead() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("notificacoes")
         .update({ lida: true })
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
       queryClient.invalidateQueries({ queryKey: ["notificacoes-unread-count"] });
     },
   });
 }
 
 export function useMarkAllNotificacoesAsRead() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async () => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) throw new Error("Usuário não autenticado");
 
       const { error } = await supabase
         .from("notificacoes")
         .update({ lida: true })
         .eq("user_id", user.user.id)
         .eq("lida", false);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
       queryClient.invalidateQueries({ queryKey: ["notificacoes-unread-count"] });
     },
   });
 }
 
 export function useDeleteNotificacao() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("notificacoes")
         .delete()
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
       queryClient.invalidateQueries({ queryKey: ["notificacoes-unread-count"] });
     },
   });
 }