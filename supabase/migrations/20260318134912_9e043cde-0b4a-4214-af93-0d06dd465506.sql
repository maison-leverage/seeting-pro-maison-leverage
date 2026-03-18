
ALTER TABLE public.prospects 
  ADD COLUMN IF NOT EXISTS audit_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS audit_score integer,
  ADD COLUMN IF NOT EXISTS audit_sector text,
  ADD COLUMN IF NOT EXISTS audit_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS audit_pdf_url text;

-- Update audit_status default to 'none' for existing null values
UPDATE public.prospects SET audit_status = 'none' WHERE audit_status IS NULL;
ALTER TABLE public.prospects ALTER COLUMN audit_status SET DEFAULT 'none';
