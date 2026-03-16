-- ============================================================
-- Migration: Fix inbound messages + add proper followup 2 & 3
-- Replace generic emoji-filled messages with professional ones
-- ============================================================

-- 1. Fix Inbound messages (was generic with emojis and "tu")
DELETE FROM message_variants WHERE category = 'first_dm_inbound';

INSERT INTO message_variants (name, category, content, is_control, is_active) VALUES
(
  'Inbound A — Curiosité',
  'first_dm_inbound',
  'Bonjour, Merci pour la demande d''ajout ! Par curiosité, qu''est-ce qui vous donne envie de me contacter ? Une envie d''échanger autour du SEO, ou simplement l''idée d''agrandir votre réseau ? Au plaisir d''échanger, Océane',
  true,
  true
),
(
  'Inbound B — Audit rapide',
  'first_dm_inbound',
  'Salut {prenom}, Merci pour l''ajout ! J''ai jeté un œil à {company} sur Google et ChatGPT simplement par curiosité, j''ai repéré 2-3 axes qui pourraient vous apporter plus de trafic et de clients. C''est notre métier, on s''occupe du référencement Google et de la visibilité sur ChatGPT pour des entreprises de votre taille. Si ça vous intéresse, je suis dispo pour en discuter. Sinon, bonne continuation !',
  false,
  true
);

-- 2. Fix Relance 2 (was generic with emojis and "tu")
DELETE FROM message_variants WHERE category = 'followup_2';

INSERT INTO message_variants (name, category, content, is_control, is_active) VALUES
(
  'Relance 2A — Concurrents',
  'followup_2',
  '{prenom},

Je reviens vers vous car j''ai vraiment identifié du potentiel pour {company} côté référencement Google et visibilité sur les IA.

Vos concurrents prennent de l''avance sur ces sujets, et il y a une vraie fenêtre de tir en ce moment.

Si vous avez 15 min cette semaine, je vous montre ce que j''ai trouvé.

Océane',
  true,
  true
),
(
  'Relance 2B — Question directe',
  'followup_2',
  '{prenom},

Est-ce que le référencement Google et la visibilité sur les IA sont des sujets qui vous concernent pour {company} ?

Je pose la question car j''ai identifié des opportunités concrètes dans votre secteur.

Si oui, je suis dispo pour un échange rapide. Si non, aucun souci !

Océane',
  false,
  true
);

-- 3. Fix Relance 3 (was generic with emojis and "tu")
DELETE FROM message_variants WHERE category = 'followup_3';

INSERT INTO message_variants (name, category, content, is_control, is_active) VALUES
(
  'Relance 3A — Dernier message',
  'followup_3',
  '{prenom},

Dernier message de ma part, je ne veux pas vous importuner.

Si le SEO et la visibilité sur les IA deviennent un sujet pour {company}, n''hésitez pas à revenir vers moi.

Je vous souhaite une excellente continuation !

Océane',
  true,
  true
),
(
  'Relance 3B — Valeur ajoutée',
  'followup_3',
  '{prenom},

Je me permets un dernier message. Si jamais vous voulez voir concrètement ce que le SEO et la visibilité sur les IA pourraient apporter à {company}, j''ai préparé quelques éléments.

Sinon, je vous souhaite le meilleur pour la suite !

Océane',
  false,
  true
);
