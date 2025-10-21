-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can create their own prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can update their own prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can delete their own prospects" ON public.prospects;

-- Create new policies for team sharing (all authenticated users can access all prospects)
CREATE POLICY "Authenticated users can view all prospects"
ON public.prospects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create prospects"
ON public.prospects
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update all prospects"
ON public.prospects
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete all prospects"
ON public.prospects
FOR DELETE
TO authenticated
USING (true);

-- Do the same for templates
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

CREATE POLICY "Authenticated users can view all templates"
ON public.templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create templates"
ON public.templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update all templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete all templates"
ON public.templates
FOR DELETE
TO authenticated
USING (true);