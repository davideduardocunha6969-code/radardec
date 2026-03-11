import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCrmLeadCampos } from "@/hooks/useCrmLeadCampos";
import type { DadosExtrasMap, DadosExtrasField } from "@/utils/trabalhista/types";
import { getFieldValue, createField, isManualField } from "@/utils/trabalhista/types";
import { withRetry } from "@/utils/supabaseRetry";

export interface UseLeadDadosSyncReturn {
  dados: DadosExtrasMap;
  loading: boolean;
  getField: (key: string) => { valor: string; meta: DadosExtrasField | null };
  setField: (key: string, valor: string, origem?: DadosExtrasField["origem"]) => Promise<void>;
  setFields: (
    fields: Array<{
      key: string;
      valor: string;
      origem?: DadosExtrasField["origem"];
      confianca?: DadosExtrasField["confianca"];
      turno?: number;
    }>
  ) => Promise<void>;
  allFieldKeys: string[];
}

export function useLeadDadosSync(leadId: string | null): UseLeadDadosSyncReturn {
  const [dados, setDados] = useState<DadosExtrasMap>({});
  const [loading, setLoading] = useState(true);
  const dadosRef = useRef<DadosExtrasMap>({});
  const { data: campos } = useCrmLeadCampos();

  const allFieldKeys = (campos || []).map((c) => c.key);

  // Load initial data
  useEffect(() => {
    if (!leadId) {
      setDados({});
      dadosRef.current = {};
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("crm_leads")
      .select("dados_extras")
      .eq("id", leadId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("useLeadDadosSync: load error", error);
          setLoading(false);
          return;
        }
        const d = (data?.dados_extras as DadosExtrasMap) || {};
        dadosRef.current = d;
        setDados(d);
        setLoading(false);
      });
  }, [leadId]);

  const getField = useCallback(
    (key: string) => getFieldValue(dadosRef.current, key),
    []
  );

  const persistToDb = useCallback(
    async (newDados: DadosExtrasMap) => {
      if (!leadId) return;
      const { error } = await supabase
        .from("crm_leads")
        .update({ dados_extras: JSON.parse(JSON.stringify(newDados)) })
        .eq("id", leadId);
      if (error) console.error("useLeadDadosSync: persist error", error);
    },
    [leadId]
  );

  const setField = useCallback(
    async (key: string, valor: string, origem: DadosExtrasField["origem"] = "preenchimento_manual") => {
      // Skip if extrator tries to overwrite manual field
      if (origem === "extrator_automatico" && isManualField(dadosRef.current, key)) {
        return;
      }

      const field = createField(valor, origem);
      const newDados = { ...dadosRef.current, [key]: field };
      dadosRef.current = newDados;
      setDados(newDados);
      await persistToDb(newDados);
    },
    [persistToDb]
  );

  const setFields = useCallback(
    async (
      fields: Array<{
        key: string;
        valor: string;
        origem?: DadosExtrasField["origem"];
        confianca?: DadosExtrasField["confianca"];
        turno?: number;
      }>
    ) => {
      let newDados = { ...dadosRef.current };
      let changed = false;

      for (const f of fields) {
        const origem = f.origem || "preenchimento_manual";
        // Skip if extrator tries to overwrite manual field
        if (origem === "extrator_automatico" && isManualField(newDados, f.key)) {
          continue;
        }
        newDados[f.key] = createField(
          f.valor,
          origem,
          f.confianca || "alta",
          f.turno ?? null
        );
        changed = true;
      }

      if (changed) {
        dadosRef.current = newDados;
        setDados(newDados);
        await persistToDb(newDados);
      }
    },
    [persistToDb]
  );

  return { dados, loading, getField, setField, setFields, allFieldKeys };
}
