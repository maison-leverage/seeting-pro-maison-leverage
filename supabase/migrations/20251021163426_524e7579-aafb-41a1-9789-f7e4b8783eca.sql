-- Add missing columns to prospects table
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS first_message_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_contact TIMESTAMP WITH TIME ZONE;

-- Create index for first_message_date for better query performance
CREATE INDEX IF NOT EXISTS idx_prospects_first_message_date ON public.prospects(first_message_date);

-- Create index for last_contact for better query performance
CREATE INDEX IF NOT EXISTS idx_prospects_last_contact ON public.prospects(last_contact);