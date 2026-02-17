import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export interface CrmChamada {
  id: string;
  lead_id: string;
  user_id: string;
  twilio_call_sid: string | null;
  numero_discado: string;
  status: string;
  duracao_segundos: number | null;
  recording_url: string | null;
  audio_url: string | null;
  transcricao: string | null;
  resumo_ia: string | null;
  feedback_ia: string | null;
  nota_ia: number | null;
  created_at: string;
  updated_at: string;
}

export function useCrmChamadas(leadId: string | undefined) {
  return useQuery({
    queryKey: ["crm_chamadas", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("crm_chamadas")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CrmChamada[];
    },
    enabled: !!leadId,
    refetchOnWindowFocus: false,
  });
}

/**
 * On mount, fix orphaned chamadas stuck in "em_chamada" or "iniciando"
 * for more than 5 minutes (they were likely interrupted by a crash/refresh).
 */
export function useCleanupOrphanedChamadas() {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;
    const cleanupOrphans = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("crm_chamadas")
        .update({ status: "interrompida" })
        .eq("user_id", user.id)
        .in("status", ["em_chamada", "iniciando"])
        .lt("updated_at", fiveMinutesAgo)
        .select("id");
      if (!error && data?.length) {
        console.log(`[Cleanup] Fixed ${data.length} orphaned chamadas`);
      }
    };
    cleanupOrphans();
  }, [user]);
}

export function useCreateChamada() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: {
      lead_id: string;
      numero_discado: string;
      twilio_call_sid?: string;
      canal?: string;
    }) => {
      const { data: chamada, error } = await supabase
        .from("crm_chamadas")
        .insert({
          lead_id: data.lead_id,
          numero_discado: data.numero_discado,
          twilio_call_sid: data.twilio_call_sid || null,
          user_id: user!.id,
          status: "iniciando",
          canal: data.canal || "voip",
        })
        .select()
        .single();
      if (error) throw error;
      return chamada as CrmChamada;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["crm_chamadas", vars.lead_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateChamada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      leadId,
      ...data
    }: {
      id: string;
      leadId: string;
      status?: string;
      twilio_call_sid?: string;
      duracao_segundos?: number;
      recording_url?: string;
      audio_url?: string;
      transcricao?: string;
      resumo_ia?: string;
    }) => {
      const updateData: Record<string, unknown> = { ...data };
      delete updateData.leadId;
      const { error } = await supabase
        .from("crm_chamadas")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
      return leadId;
    },
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: ["crm_chamadas", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
