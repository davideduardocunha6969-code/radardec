import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ScriptItem, ScriptSdr } from "./useScriptsSdr";

export type ScriptCloser = ScriptSdr;

export function useScriptsCloser() {
  return useQuery({
    queryKey: ["scripts_sdr", "closer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scripts_sdr" as any)
        .select("*")
        .eq("tipo", "closer")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as ScriptCloser[]).map((s) => ({
        ...s,
        apresentacao: Array.isArray(s.apresentacao) ? s.apresentacao : [],
        qualificacao: Array.isArray(s.qualificacao) ? s.qualificacao : [],
      }));
    },
  });
}

export function useCreateScriptCloser() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (data: {
      nome: string;
      descricao?: string;
      apresentacao: ScriptItem[];
      qualificacao: ScriptItem[];
    }) => {
      const { error } = await supabase.from("scripts_sdr" as any).insert({
        nome: data.nome,
        descricao: data.descricao || null,
        apresentacao: JSON.parse(JSON.stringify(data.apresentacao)),
        qualificacao: JSON.parse(JSON.stringify(data.qualificacao)),
        tipo: "closer",
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts_sdr"] });
      toast.success("Script Closer criado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateScriptCloser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      nome?: string;
      descricao?: string;
      apresentacao?: ScriptItem[];
      qualificacao?: ScriptItem[];
      ativo?: boolean;
    }) => {
      const { id, ...rest } = data;
      const updateData: Record<string, unknown> = { ...rest };
      if (rest.apresentacao) updateData.apresentacao = JSON.parse(JSON.stringify(rest.apresentacao));
      if (rest.qualificacao) updateData.qualificacao = JSON.parse(JSON.stringify(rest.qualificacao));
      const { error } = await supabase.from("scripts_sdr" as any).update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts_sdr"] });
      toast.success("Script Closer atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteScriptCloser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scripts_sdr" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts_sdr"] });
      toast.success("Script Closer excluído!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
