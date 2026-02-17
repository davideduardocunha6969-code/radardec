-- Create storage bucket for audio recordings if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('atendimentos-audio', 'atendimentos-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload audio recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'atendimentos-audio');

-- Allow authenticated users to read their uploads
CREATE POLICY "Users can read audio recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'atendimentos-audio');

-- Allow authenticated users to update their uploads
CREATE POLICY "Users can update audio recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'atendimentos-audio');
