-- ===========================================
-- A/B Testing des messages + Monitoring
-- ===========================================

-- Table des variantes de messages pour l'A/B testing
CREATE TABLE IF NOT EXISTS message_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'first_dm_inbound', 'first_dm_visiteur_profil', 'first_dm_relation_dormante', 'first_dm_outbound', 'followup_1', 'followup_2', 'followup_3'
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_control BOOLEAN DEFAULT false, -- the original/default variant
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table de tracking : quelle variante a été envoyée à quel prospect
CREATE TABLE IF NOT EXISTS message_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID NOT NULL REFERENCES prospects(id),
  variant_id UUID NOT NULL REFERENCES message_variants(id),
  category TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  got_reply BOOLEAN DEFAULT false,
  reply_at TIMESTAMPTZ,
  user_id UUID NOT NULL
);

-- Index pour performance analytics
CREATE INDEX IF NOT EXISTS idx_message_sends_variant ON message_sends(variant_id);
CREATE INDEX IF NOT EXISTS idx_message_sends_prospect ON message_sends(prospect_id);
CREATE INDEX IF NOT EXISTS idx_message_sends_category ON message_sends(category);
CREATE INDEX IF NOT EXISTS idx_message_sends_sent_at ON message_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_variants_category ON message_variants(category);

-- Ajouter variant_id sur activity_logs pour le tracking
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Insert les variantes "control" (messages actuels) pour chaque catégorie
INSERT INTO message_variants (name, category, content, is_control) VALUES
  ('Inbound V1 (Original)', 'first_dm_inbound', 'Salut {prenom} 👋

Merci pour l''ajout ! J''ai vu que tu étais {position} chez {company}.

On accompagne des entreprises comme la tienne en SEO & GEO pour générer du trafic qualifié.

Est-ce que c''est un sujet qui t''intéresse ?', true),

  ('Visiteur V1 (Original)', 'first_dm_visiteur_profil', 'Salut {prenom} 👋

J''ai vu que tu avais visité mon profil — curieux de savoir ce qui t''a attiré !

Tu es {position} chez {company}, c''est bien ça ?

On aide des entreprises comme la tienne à se positionner sur Google grâce au SEO & GEO.

Ça te parle ?', true),

  ('Dormant V1 (Original)', 'first_dm_relation_dormante', 'Salut {prenom} 👋

On est connectés depuis un moment mais on n''a jamais échangé !

Je vois que tu es {position} chez {company} — on accompagne justement des entreprises comme la tienne en SEO & GEO.

Est-ce que c''est un sujet d''actualité pour toi ?', true),

  ('Outbound V1 (Original)', 'first_dm_outbound', 'Salut {prenom} 👋

Je me permets de te contacter car ton profil de {position} chez {company} a retenu mon attention.

On accompagne des PME/TPE en SEO & GEO pour générer du trafic qualifié et des leads.

Est-ce que c''est un levier que vous exploitez déjà ?', true),

  ('Relance 1 V1 (Original)', 'followup_1', 'Salut {prenom}, je me permets de revenir vers toi 😊

As-tu eu l''occasion de réfléchir à ce que je t''avais partagé sur le SEO & GEO ?

Je serais ravie d''en discuter si ça t''intéresse !', true),

  ('Relance 2 V1 (Original)', 'followup_2', '{prenom}, petit message rapide 👋

Je ne veux pas être insistante, mais je pense vraiment qu''on pourrait t''apporter de la valeur côté visibilité en ligne.

Si c''est pas le bon moment, dis-le moi, pas de souci !', true),

  ('Relance 3 V1 (Original)', 'followup_3', 'Dernier petit message {prenom} 😊

Je comprends que tu sois occupé(e). Si jamais le SEO & GEO devient un sujet, n''hésite pas à revenir vers moi.

Belle journée ! ☀️', true);

-- Enable RLS
ALTER TABLE message_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sends ENABLE ROW LEVEL SECURITY;

-- Policies - tout le monde peut lire, seuls les users auth peuvent écrire
CREATE POLICY "Anyone can read variants" ON message_variants FOR SELECT USING (true);
CREATE POLICY "Auth users can manage variants" ON message_variants FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can manage sends" ON message_sends FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can read sends" ON message_sends FOR SELECT USING (true);
