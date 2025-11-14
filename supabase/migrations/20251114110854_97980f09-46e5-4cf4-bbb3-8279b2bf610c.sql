-- Ajouter les nouveaux champs pour le suivi des prospects R1
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS no_show boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS proposal_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS r2_scheduled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS no_follow_up boolean DEFAULT false;