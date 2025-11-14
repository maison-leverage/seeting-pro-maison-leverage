-- Créer la table pour stocker les messages envoyés aux prospects
CREATE TABLE IF NOT EXISTS public.prospect_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID NOT NULL,
  template_id UUID,
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospect_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view messages for their prospects"
  ON public.prospect_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = prospect_messages.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create messages for their prospects"
  ON public.prospect_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = prospect_messages.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update messages for their prospects"
  ON public.prospect_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = prospect_messages.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete messages for their prospects"
  ON public.prospect_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = prospect_messages.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

-- Trigger pour updated_at
CREATE TRIGGER update_prospect_messages_updated_at
  BEFORE UPDATE ON public.prospect_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();