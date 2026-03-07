
-- Remove duplicates keeping only the latest per profile per day
DELETE FROM profile_history a
USING profile_history b
WHERE a.id < b.id
  AND a.profile_id = b.profile_id
  AND DATE(a.recorded_at AT TIME ZONE 'America/Sao_Paulo') = DATE(b.recorded_at AT TIME ZONE 'America/Sao_Paulo');

-- Create unique index to enforce 1 record per profile per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_history_profile_day
ON profile_history (profile_id, (DATE(recorded_at AT TIME ZONE 'America/Sao_Paulo')));
