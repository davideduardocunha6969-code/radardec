
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
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR lead IN SELECT * FROM jsonb_array_elements(leads_data)
  LOOP
    INSERT INTO public.crm_leads (
      funil_id,
      coluna_id,
      nome,
      endereco,
      telefones,
      dados_extras,
      ordem,
      user_id
    ) VALUES (
      (lead->>'funil_id')::uuid,
      (lead->>'coluna_id')::uuid,
      lead->>'nome',
      lead->>'endereco',
      COALESCE(lead->'telefones', '[]'::jsonb),
      COALESCE(lead->'dados_extras', '{}'::jsonb),
      COALESCE((lead->>'ordem')::integer, 0),
      auth.uid()
    );
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;
