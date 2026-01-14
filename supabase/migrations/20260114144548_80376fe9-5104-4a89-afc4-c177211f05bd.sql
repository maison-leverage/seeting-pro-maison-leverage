-- Supprimer les policies restrictives actuelles
DROP POLICY IF EXISTS "Users can view their own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can insert their own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can update their own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can delete their own prospects" ON prospects;

DROP POLICY IF EXISTS "Users can view their own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;

DROP POLICY IF EXISTS "Users can view their own activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can update their own activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can delete their own activity_logs" ON activity_logs;

-- Créer des policies pour équipe partagée (tous les utilisateurs authentifiés)
CREATE POLICY "Team can view all prospects"
ON prospects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can insert prospects"
ON prospects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team can update prospects"
ON prospects FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can delete prospects"
ON prospects FOR DELETE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can view all templates"
ON templates FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can insert templates"
ON templates FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team can update templates"
ON templates FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can delete templates"
ON templates FOR DELETE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can view all activity_logs"
ON activity_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can insert activity_logs"
ON activity_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team can update activity_logs"
ON activity_logs FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can delete activity_logs"
ON activity_logs FOR DELETE
USING (auth.uid() IS NOT NULL);