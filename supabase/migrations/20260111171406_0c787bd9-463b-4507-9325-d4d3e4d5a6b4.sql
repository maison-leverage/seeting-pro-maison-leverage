-- PARTIE 1: Soft Delete pour Prospects
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- PARTIE 2: Enrichir activity_logs avec les infos prospect
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS prospect_name TEXT,
ADD COLUMN IF NOT EXISTS prospect_company TEXT;

-- PARTIE 3: Supprimer la policy DELETE sur activity_logs pour rendre les logs immuables
DROP POLICY IF EXISTS "Users can delete own activity logs" ON activity_logs;