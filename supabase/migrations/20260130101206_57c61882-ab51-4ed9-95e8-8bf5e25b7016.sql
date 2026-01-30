-- Create a function to check if user can validate content (admin or marketing_manager)
CREATE OR REPLACE FUNCTION public.can_validate_content(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'marketing_manager')
  )
$$;