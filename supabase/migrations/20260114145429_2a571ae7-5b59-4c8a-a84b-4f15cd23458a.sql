-- Créer une table pour stocker le contenu de Formation
CREATE TABLE public.formation_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  text_content TEXT DEFAULT '',
  videos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.formation_content ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Team can view formation content"
ON formation_content FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Seuls les admins peuvent modifier (on gère ça côté frontend)
CREATE POLICY "Team can update formation content"
ON formation_content FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team can insert formation content"
ON formation_content FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger pour updated_at
CREATE TRIGGER update_formation_content_updated_at
BEFORE UPDATE ON public.formation_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les sections par défaut
INSERT INTO public.formation_content (section_key, text_content, videos) VALUES
  ('seo', '', '[]'),
  ('avatar', '', '[]'),
  ('leads', '', '[]'),
  ('daily', '', '[]'),
  ('booking', '', '[]');