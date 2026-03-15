
CREATE TABLE IF NOT EXISTS message_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_message_sends_variant ON message_sends(variant_id);
CREATE INDEX IF NOT EXISTS idx_message_sends_prospect ON message_sends(prospect_id);
CREATE INDEX IF NOT EXISTS idx_message_variants_category ON message_variants(category);

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS variant_id UUID;

ALTER TABLE message_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read variants" ON message_variants FOR SELECT USING (true);
CREATE POLICY "Auth users can manage variants" ON message_variants FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can manage sends" ON message_sends FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can read sends" ON message_sends FOR SELECT USING (true);
