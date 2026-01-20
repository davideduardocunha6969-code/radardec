-- Create table for AI prompts
CREATE TABLE public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  prompt TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Policies - all authenticated users can view prompts
CREATE POLICY "Authenticated users can view all prompts"
ON public.ai_prompts FOR SELECT
TO authenticated
USING (true);

-- Only creator can insert their own prompts
CREATE POLICY "Users can create their own prompts"
ON public.ai_prompts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only creator can update their own prompts
CREATE POLICY "Users can update their own prompts"
ON public.ai_prompts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Only creator can delete their own prompts
CREATE POLICY "Users can delete their own prompts"
ON public.ai_prompts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_prompts_updated_at
BEFORE UPDATE ON public.ai_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();