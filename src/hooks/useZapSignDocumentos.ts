import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZapSignTemplate {
  id: string;
  name: string;
  token: string;
}

export interface ZapSignDocumento {
  id: string;
  lead_id: string;
  user_id: string;
  doc_token: string | null;
  signer_token: string | null;
  sign_url: string | null;
  template_id: string | null;
  template_nome: string | null;
  nome_documento: string | null;
  status: string;
  dados_enviados: Record<string, unknown> | null;
  created_at: string;
}

export function useZapSignTemplates() {
  return useQuery({
    queryKey: ["zapsign-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zapsign-list-templates");
      if (error) throw error;
      return data as ZapSignTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useZapSignDocumentos(leadId: string | null) {
  return useQuery({
    queryKey: ["zapsign-documentos", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zapsign_documentos" as any)
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ZapSignDocumento[];
    },
  });
}

export function useCreateZapSignDoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      template_id: string;
      template_nome: string;
      signer_name: string;
      signer_email?: string;
      signer_phone?: string;
      lead_id: string;
      field_data?: Record<string, string>;
    }) => {
      const { data, error } = await supabase.functions.invoke("zapsign-create-doc", {
        body: params,
      });
      if (error) throw error;
      return data as { sign_url: string; doc_token: string; signer_token: string; nome: string };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["zapsign-documentos", variables.lead_id] });
    },
  });
}
