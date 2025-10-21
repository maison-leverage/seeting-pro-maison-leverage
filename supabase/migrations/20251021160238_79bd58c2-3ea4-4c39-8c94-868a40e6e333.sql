-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create prospects table
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL DEFAULT 'premier_message',
  priority TEXT NOT NULL DEFAULT '2',
  qualification TEXT NOT NULL DEFAULT 'loom',
  hype TEXT NOT NULL DEFAULT 'tiede',
  tags JSONB DEFAULT '[]'::jsonb,
  reminder_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  follow_up_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Prospects policies
CREATE POLICY "Users can view their own prospects"
  ON public.prospects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prospects"
  ON public.prospects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prospects"
  ON public.prospects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prospects"
  ON public.prospects FOR DELETE
  USING (auth.uid() = user_id);

-- Create prospect_notes table
CREATE TABLE public.prospect_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prospect_notes ENABLE ROW LEVEL SECURITY;

-- Notes policies (inherit from prospect ownership)
CREATE POLICY "Users can view notes for their prospects"
  ON public.prospect_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_notes.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their prospects"
  ON public.prospect_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_notes.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes for their prospects"
  ON public.prospect_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_notes.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

-- Create prospect_history table
CREATE TABLE public.prospect_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prospect_history ENABLE ROW LEVEL SECURITY;

-- History policies (inherit from prospect ownership)
CREATE POLICY "Users can view history for their prospects"
  ON public.prospect_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_history.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create history for their prospects"
  ON public.prospect_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = prospect_history.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence TEXT NOT NULL,
  content TEXT NOT NULL,
  notes TEXT,
  target_types JSONB DEFAULT '[]'::jsonb,
  target_sectors JSONB DEFAULT '[]'::jsonb,
  target_sizes JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  sent_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can view their own templates"
  ON public.templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();