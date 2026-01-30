-- Create taraweeh_lineup table to store daily imam/speaker lineups
CREATE TABLE IF NOT EXISTS taraweeh_lineup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    lineup JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment describing the lineup JSON structure
COMMENT ON COLUMN taraweeh_lineup.lineup IS 'JSON structure:
{
  "sessionOne": {
    "firstFourImam": { "imam_name": "string", "imam_img": "url" },
    "speaker": { "speaker_name": "string", "speaker_img": "url" },
    "secondFourImam": { "imam_name": "string", "imam_img": "url" }
  },
  "sessionTwo": {
    "firstFourImam": { "imam_name": "string", "imam_img": "url" },
    "speaker": { "speaker_name": "string", "speaker_img": "url" },
    "secondFourImam": { "imam_name": "string", "imam_img": "url" },
    "witrImam": { "imam_name": "string", "imam_img": "url" }
  }
}';

-- Create index on date for faster lookups
CREATE INDEX IF NOT EXISTS idx_taraweeh_lineup_date ON taraweeh_lineup(date);

-- Enable RLS
ALTER TABLE taraweeh_lineup ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read the lineup
CREATE POLICY "Anyone can view taraweeh lineup"
    ON taraweeh_lineup
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users with admin role can insert/update (adjust as needed)
-- For now, allowing authenticated users to manage for testing
CREATE POLICY "Authenticated users can manage taraweeh lineup"
    ON taraweeh_lineup
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_taraweeh_lineup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER taraweeh_lineup_updated_at
    BEFORE UPDATE ON taraweeh_lineup
    FOR EACH ROW
    EXECUTE FUNCTION update_taraweeh_lineup_updated_at();
