-- Create setter_objectives table for daily/weekly targets
CREATE TABLE public.setter_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_target INTEGER NOT NULL DEFAULT 25,
  weekly_target INTEGER NOT NULL DEFAULT 125,
  work_days TEXT[] NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.setter_objectives ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own objectives"
ON public.setter_objectives FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own objectives"
ON public.setter_objectives FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives"
ON public.setter_objectives FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_setter_objectives_updated_at
BEFORE UPDATE ON public.setter_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();