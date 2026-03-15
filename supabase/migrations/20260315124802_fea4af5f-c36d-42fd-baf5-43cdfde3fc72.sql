CREATE TABLE IF NOT EXISTS public.prospect_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_sentiment TEXT,
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prospect_responses_prospect ON public.prospect_responses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_responses_sentiment ON public.prospect_responses(response_sentiment);

ALTER TABLE public.prospect_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read responses" ON public.prospect_responses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can insert responses" ON public.prospect_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can update responses" ON public.prospect_responses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can delete responses" ON public.prospect_responses FOR DELETE USING (auth.uid() IS NOT NULL);