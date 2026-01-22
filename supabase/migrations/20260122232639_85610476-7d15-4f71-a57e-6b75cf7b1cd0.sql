-- Allow all authenticated users to view profiles (needed for selecting responsáveis in atividades)
CREATE POLICY "Authenticated users can view all profiles for selection"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);