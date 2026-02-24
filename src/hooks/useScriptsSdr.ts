import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ScriptItem {
  id: string;
  label: string;
  description: string;
}

export interface ScriptSdr {
  id: string;
  nome: string;
  descricao: string | null;
  apresentacao: ScriptItem[];
  qualificacao: ScriptItem[];
  show_rate: ScriptItem[];
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useScriptsSdr() {
  return useQuery({
    queryKey: ["scripts_sdr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scripts_sdr" as any)
        .select("*")
        .eq("tipo", "sdr")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as ScriptSdr[]).map((s) => ({
        ...s,
        apresentacao: Array.isArray(s.apresentacao) ? s.apresentacao : [],
        qualificacao: Array.isArray(s.qualificacao) ? s.qualificacao : [],
        show_rate: Array.isArray((s as any).show_rate) ? (s as any).show_rate : [],
      }));
    },
  });
}

export function useActiveScriptSdr() {
  return useQuery({
    queryKey: ["scripts_sdr", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scripts_sdr" as any)
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      const s = (data as unknown as ScriptSdr[])?.[0];
      if (!s) return null;
      return {
        ...s,
        apresentacao: Array.isArray(s.apresentacao) ? s.apresentacao : [],
        qualificacao: Array.isArray(s.qualificacao) ? s.qualificacao : [],
        show_rate: Array.isArray((s as any).show_rate) ? (s as any).show_rate : [],
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateScriptSdr() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (data: {
      nome: string;
      descricao?: string;
      apresentacao: ScriptItem[];
      qualificacao: ScriptItem[];
      show_rate?: ScriptItem[];
    }) => {
      const { error } = await supabase.from("scripts_sdr" as any).insert({
        nome: data.nome,
        descricao: data.descricao || null,
        apresentacao: JSON.parse(JSON.stringify(data.apresentacao)),
        qualificacao: JSON.parse(JSON.stringify(data.qualificacao)),
        show_rate: JSON.parse(JSON.stringify(data.show_rate || [])),
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts_sdr"] });
      toast.success("Script SDR criado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateScriptSdr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      nome?: string;
      descricao?: string;
      apresentacao?: ScriptItem[];
      qualificacao?: ScriptItem[];
      show_rate?: ScriptItem[];
      ativo?: boolean;
    }) => {
      const { id, ...rest } = data;
      const updateData: Record<string, unknown> = { ...rest };
      if (rest.apresentacao) updateData.apresentacao = JSON.parse(JSON.stringify(rest.apresentacao));
      if (rest.qualificacao) updateData.qualificacao = JSON.parse(JSON.stringify(rest.qualificacao));
      if (rest.show_rate) updateData.show_rate = JSON.parse(JSON.stringify(rest.show_rate));
      const { error } = await supabase.from("scripts_sdr" as any).update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts_sdr"] });
      toast.success("Script SDR atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteScriptSdr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scripts_sdr" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts_sdr"] });
      toast.success("Script SDR excluído!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
