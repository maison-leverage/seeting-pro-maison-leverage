
-- ============================================
-- PARTIE 1: NETTOYAGE DES DONNÉES INCOHÉRENTES
-- ============================================

-- 1. Supprimer les 194 follow_up_dm de test pour le prospect Filipe Da Cruz
DELETE FROM activity_logs 
WHERE lead_id = 'ce485a00-5ab4-4d3c-8881-2ca8a77fc7f5' 
AND type = 'follow_up_dm';

-- 2. Migrer les anciens statuts vers les nouveaux
-- 'clos' -> 'r1_programme' (car closé = deal fait)
UPDATE prospects SET status = 'r1_programme' WHERE status = 'clos' AND is_deleted = false;

-- 'rdv_pris' -> 'r1_programme'
UPDATE prospects SET status = 'r1_programme' WHERE status = 'rdv_pris' AND is_deleted = false;

-- 'interesse' -> 'discussion'
UPDATE prospects SET status = 'discussion' WHERE status = 'interesse' AND is_deleted = false;

-- 'en_attente' -> 'premier_message'
UPDATE prospects SET status = 'premier_message' WHERE status = 'en_attente' AND is_deleted = false;

-- 3. Synchroniser follow_up_count avec le nombre réel de relances dans activity_logs
UPDATE prospects p
SET follow_up_count = COALESCE((
  SELECT COUNT(*) 
  FROM activity_logs a 
  WHERE a.lead_id = p.id 
  AND a.type = 'follow_up_dm'
), 0);

-- ============================================
-- PARTIE 2: SÉCURISATION DES RLS POLICIES
-- ============================================

-- === PROSPECTS: Restreindre aux données de l'utilisateur ===
DROP POLICY IF EXISTS "Authenticated users can view all prospects" ON prospects;
DROP POLICY IF EXISTS "Authenticated users can create prospects" ON prospects;
DROP POLICY IF EXISTS "Authenticated users can update all prospects" ON prospects;
DROP POLICY IF EXISTS "Authenticated users can delete all prospects" ON prospects;

CREATE POLICY "Users can view their own prospects" 
ON prospects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prospects" 
ON prospects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prospects" 
ON prospects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prospects" 
ON prospects FOR DELETE 
USING (auth.uid() = user_id);

-- === TEMPLATES: Restreindre aux données de l'utilisateur ===
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can update all templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can delete all templates" ON templates;

CREATE POLICY "Users can view their own templates" 
ON templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON templates FOR DELETE 
USING (auth.uid() = user_id);

-- === ACTIVITY_LOGS: Restreindre la lecture aux données de l'utilisateur ===
DROP POLICY IF EXISTS "Authenticated users can view all activity logs" ON activity_logs;

CREATE POLICY "Users can view their own activity logs" 
ON activity_logs FOR SELECT 
USING (auth.uid() = user_id);
