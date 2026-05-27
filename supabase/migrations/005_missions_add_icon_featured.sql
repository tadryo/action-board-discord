-- Add icon_url and is_featured columns to missions table
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOL NOT NULL DEFAULT false;
