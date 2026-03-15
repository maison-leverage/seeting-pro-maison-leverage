-- Table pour stocker les réponses des prospects et l'analyse Claude
CREATE TABLE IF NOT EXISTS prospect_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_sentiment TEXT DEFAULT 'neutral', -- positive, neutral, negative, hesitant
  emotional_analysis JSONB DEFAULT '{}'::jsonb,
  -- emotional_analysis contains:
  -- {
  --   "dominant_emotion": "curiosité|peur|intérêt|méfiance|enthousiasme|agacement|...",
  --   "hidden_objections": ["prix", "timing", "confiance", ...],
  --   "buying_signals": ["demande de détails", "mentionne un besoin", ...],
  --   "temperature": 1-10,
  --   "summary": "Résumé court de l'état émotionnel"
  -- }
  suggested_replies JSONB DEFAULT '[]'::jsonb,
  -- suggested_replies contains:
  -- [
  --   { "tone": "empathique", "message": "...", "strategy": "..." },
  --   { "tone": "direct", "message": "...", "strategy": "..." },
  --   { "tone": "valeur", "message": "...", "strategy": "..." }
  -- ]
  chosen_reply_index INTEGER DEFAULT NULL, -- which suggestion the setter chose (0, 1, 2)
  custom_reply TEXT DEFAULT NULL, -- if setter wrote their own instead
  created_at TIMESTAMPTZ DEFAULT now(),
  analyzed_at TIMESTAMPTZ DEFAULT NULL
);

-- Index pour retrouver les réponses d'un prospect rapidement
CREATE INDEX idx_prospect_responses_prospect_id ON prospect_responses(prospect_id);
CREATE INDEX idx_prospect_responses_sentiment ON prospect_responses(response_sentiment);
CREATE INDEX idx_prospect_responses_created_at ON prospect_responses(created_at DESC);

-- RLS
ALTER TABLE prospect_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all prospect responses"
  ON prospect_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert prospect responses"
  ON prospect_responses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update prospect responses"
  ON prospect_responses FOR UPDATE
  TO authenticated
  USING (true);
