-- Add capacity_status column to jummah table
-- Values: 'green' (space available), 'yellow' (filling up), 'red' (full), or NULL (no status shown)

ALTER TABLE jummah 
ADD COLUMN IF NOT EXISTS capacity_status TEXT DEFAULT NULL;

-- Add constraint to ensure only valid values
ALTER TABLE jummah 
ADD CONSTRAINT jummah_capacity_status_check 
CHECK (capacity_status IS NULL OR capacity_status IN ('green', 'yellow', 'red'));

-- Note: For taraweeh_lineup, the capacity_status will be stored in the existing 
-- lineup JSONB column as sessionOne.capacity_status and sessionTwo.capacity_status
-- No schema change needed since it's already a flexible JSON structure
