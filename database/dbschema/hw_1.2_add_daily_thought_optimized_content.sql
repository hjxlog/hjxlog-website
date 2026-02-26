-- Add optimized_content column for storing editable AI-polished thought text
-- Execute on existing databases created before this change

ALTER TABLE daily_thoughts
ADD COLUMN IF NOT EXISTS optimized_content TEXT;
