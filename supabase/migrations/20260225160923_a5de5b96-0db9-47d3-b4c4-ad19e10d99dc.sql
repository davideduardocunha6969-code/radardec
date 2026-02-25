
-- Add new columns
ALTER TABLE public.crm_leads ADD COLUMN etapa_desde timestamptz DEFAULT now();
ALTER TABLE public.crm_leads ADD COLUMN ultimo_contato_em timestamptz;

-- Backfill existing data
UPDATE public.crm_leads SET etapa_desde = updated_at;

UPDATE public.crm_leads SET ultimo_contato_em = sub.max_at
FROM (SELECT lead_id, MAX(created_at) AS max_at FROM public.crm_chamadas GROUP BY lead_id) sub
WHERE public.crm_leads.id = sub.lead_id;

-- Trigger to auto-update ultimo_contato_em
CREATE OR REPLACE FUNCTION public.update_lead_ultimo_contato()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.crm_leads
  SET ultimo_contato_em = now()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_lead_ultimo_contato
AFTER INSERT ON public.crm_chamadas
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_ultimo_contato();

-- Update bulk_insert_leads to include etapa_desde
CREATE OR REPLACE FUNCTION public.bulk_insert_leads(leads_data jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead jsonb;
  inserted_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR lead IN SELECT * FROM jsonb_array_elements(leads_data)
  LOOP
    INSERT INTO public.crm_leads (
      funil_id, coluna_id, nome, endereco, telefones, dados_extras, ordem, user_id, etapa_desde
    ) VALUES (
      (lead->>'funil_id')::uuid,
      (lead->>'coluna_id')::uuid,
      lead->>'nome',
      lead->>'endereco',
      COALESCE(lead->'telefones', '[]'::jsonb),
      COALESCE(lead->'dados_extras', '{}'::jsonb),
      COALESCE((lead->>'ordem')::integer, 0),
      auth.uid(),
      now()
    );
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;
