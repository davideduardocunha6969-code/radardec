CREATE OR REPLACE FUNCTION public.update_resultado_por_numero(p_session_id uuid, p_numero text, p_status text)
RETURNS void AS $$
  UPDATE public.power_dialer_sessions
  SET resultado_por_numero = COALESCE(resultado_por_numero, '{}'::jsonb) || jsonb_build_object(p_numero, p_status)
  WHERE id = p_session_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;