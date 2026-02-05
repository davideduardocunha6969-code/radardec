-- Add new status values to the candidato_status enum
DO $$ 
BEGIN
  BEGIN
    ALTER TYPE public.candidato_status ADD VALUE 'agendar_entrevista';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.candidato_status ADD VALUE 'entrevista_agendada';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.candidato_status ADD VALUE 'entrevista_coordenador';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.candidato_status ADD VALUE 'proposta_enviada';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.candidato_status ADD VALUE 'proposta_recusada';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;