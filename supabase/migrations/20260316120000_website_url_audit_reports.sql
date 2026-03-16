-- =============================================
-- Migration: Add website_url to prospects + audit_reports table
-- Date: 2026-03-16
-- Purpose: Allow auto-generated SEO/GEO audits per prospect
-- =============================================

-- 1. Add website_url column to prospects
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 2. Add audit status tracking
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS audit_status TEXT DEFAULT NULL;
-- Values: NULL (no url), 'pending', 'generating', 'ready', 'error'

-- 3. Create audit_reports table to store generated audits
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  website_url TEXT NOT NULL,

  -- Audit content
  html_content TEXT NOT NULL,

  -- Scores extracted from the audit
  score_performance INTEGER,
  score_seo INTEGER,
  score_accessibility INTEGER,
  score_best_practices INTEGER,
  score_geo INTEGER,

  -- Metadata
  status TEXT NOT NULL DEFAULT 'ready',
  error_message TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_reports_prospect_id ON audit_reports(prospect_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_user_id ON audit_reports(user_id);

-- 5. RLS policies for audit_reports
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit reports"
  ON audit_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit reports"
  ON audit_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit reports"
  ON audit_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit reports"
  ON audit_reports FOR DELETE
  USING (auth.uid() = user_id);
