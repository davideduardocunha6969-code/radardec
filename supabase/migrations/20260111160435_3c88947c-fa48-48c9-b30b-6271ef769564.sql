-- Create table for holidays
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no auth required for this app)
CREATE POLICY "Anyone can view holidays" 
ON public.holidays 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can insert holidays" 
ON public.holidays 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public delete access
CREATE POLICY "Anyone can delete holidays" 
ON public.holidays 
FOR DELETE 
USING (true);

-- Create index for faster date lookups
CREATE INDEX idx_holidays_date ON public.holidays(date);