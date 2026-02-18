import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FunilMembro {
  id: string;
  funil_id: string;
  profile_id: string;
  papel: "sdr" | "closer";
  created_at: string;
  profiles?: { id: string; display_name: string } | null;
}

export function useFunilMembros(funilId: string | undefined) {
  return useQuery({
    queryKey: ["crm_funil_membros", funilId],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from("crm_funil_membros")
        .select("*, profiles(id, display_name)")
        .eq("funil_id", funilId);
      if (error) throw error;
      return data as unknown as FunilMembro[];
    },
    enabled: !!funilId,
  });
}

export function useFunilClosers(funilId: string | undefined) {
  return useQuery({
    queryKey: ["crm_funil_membros", funilId, "closers"],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from("crm_funil_membros")
        .select("profile_id, profiles(id, display_name)")
        .eq("funil_id", funilId)
        .eq("papel", "closer");
      if (error) throw error;
      return data as unknown as { profile_id: string; profiles: { id: string; display_name: string } }[];
    },
    enabled: !!funilId,
  });
}

export function useSetFunilMembros() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      funilId,
      sdrs,
      closers,
    }: {
      funilId: string;
      sdrs: string[];
      closers: string[];
    }) => {
      // Delete all existing members for this funnel
      const { error: delError } = await supabase
        .from("crm_funil_membros")
        .delete()
        .eq("funil_id", funilId);
      if (delError) throw delError;

      // Insert new members
      const rows = [
        ...sdrs.map((id) => ({ funil_id: funilId, profile_id: id, papel: "sdr" as const })),
        ...closers.map((id) => ({ funil_id: funilId, profile_id: id, papel: "closer" as const })),
      ];
      if (rows.length > 0) {
        const { error } = await supabase.from("crm_funil_membros").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["crm_funil_membros", vars.funilId] });
      toast.success("Equipe do funil atualizada!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
