
-- Indexes on audit_reports
CREATE INDEX IF NOT EXISTS idx_audit_reports_prospect_id ON public.audit_reports(prospect_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_user_id ON public.audit_reports(user_id);

-- Enable RLS
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own audits" ON public.audit_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audits" ON public.audit_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own audits" ON public.audit_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own audits" ON public.audit_reports FOR DELETE USING (auth.uid() = user_id);
