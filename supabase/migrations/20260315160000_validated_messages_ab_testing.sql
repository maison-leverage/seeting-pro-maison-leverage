-- ============================================================
-- Migration: Insert 6 validated A/B test messages
-- Categories: outbound, visiteur_profil, relation_dormante
-- Each has 2 variants (A = control, B = challenger)
-- ============================================================

-- 1. Delete old generic control variants for the 3 categories we're replacing
DELETE FROM message_variants WHERE category = 'first_dm_outbound';
DELETE FROM message_variants WHERE category = 'first_dm_visiteur_profil';
DELETE FROM message_variants WHERE category = 'first_dm_relation_dormante';

-- 2. Insert validated Outbound messages
INSERT INTO message_variants (name, category, content, is_control, is_active) VALUES
(
  'Outbound A — Curiosité',
  'first_dm_outbound',
  'Bonjour, Merci pour la demande d''ajout ! Par curiosité, qu''est-ce qui vous donne envie de me contacter ? Une envie d''échanger autour du SEO, ou simplement l''idée d''agrandir votre réseau ? Au plaisir d''échanger, Océane',
  true,
  true
),
(
  'Outbound B — Audit rapide',
  'first_dm_outbound',
  'Salut {prenom}, Merci pour l''ajout ! J''ai jeté un œil à {company} sur Google et ChatGPT simplement par curiosité, j''ai repéré 2-3 axes qui pourraient vous apporter plus de trafic et de clients. C''est notre métier, on s''occupe du référencement Google et de la visibilité sur ChatGPT pour des entreprises de votre taille. Si ça vous intéresse, je suis dispo pour en discuter. Sinon, bonne continuation !',
  false,
  true
);

-- 3. Insert validated Visiteur Profil messages
INSERT INTO message_variants (name, category, content, is_control, is_active) VALUES
(
  'Visiteur A — Timide',
  'first_dm_visiteur_profil',
  'Salut {prenom}, J''ai vu que vous aviez jeté un œil à mon profil, ne soyez pas timide ! C''était suite à un post que vous avez vu, ou le SEO et la visibilité sur les IA c''est un sujet pour {company} ? Dans les deux cas, ravie d''échanger ! Océane',
  true,
  true
),
(
  'Visiteur B — Audit concurrents',
  'first_dm_visiteur_profil',
  'Salut {prenom}, J''ai vu que vous avez regardé mon profil, j''en ai profité pour regarder votre référencement sur Google pour {company}, et sur les IA. Il y a clairement des positions à prendre face à vos concurrents sur ce secteur. Si c''est un sujet, on en parle. Sinon, pas de souci ! Océane',
  false,
  true
);

-- 4. Insert validated Relation Dormante messages
INSERT INTO message_variants (name, category, content, is_control, is_active) VALUES
(
  'Dormant A — Direct',
  'first_dm_relation_dormante',
  'Salut {prenom}, On est connectés depuis un moment mais on n''a jamais pris le temps de parler ! J''ai regardé {company} sur Google et ChatGPT, il y a encore énormément de positions à prendre face à vos concurrents. Si c''est un sujet, je suis dispo pour en parler. Sinon, pas de souci ! Océane',
  true,
  true
),
(
  'Dormant B — Big Idea IA',
  'first_dm_relation_dormante',
  'Salut {prenom}, On est connectés depuis un moment mais on n''a jamais pris le temps de discuter ! J''en ai profité pour regarder {company} sur ChatGPT et Perplexity vous n''apparaissez pas du tout. Le problème en ce moment, c''est que de plus en plus de vos clients potentiels passent par les IA au lieu de Google pour trouver un prestataire. Chez Maison Leverage, on a développé une méthode pour positionner les entreprises directement dans les réponses des IA. Tous nos clients y sont aujourd''hui. Si vous voulez pas laisser cette place à vos concurrents, je suis dispo pour en parler ! Océane',
  false,
  true
);
