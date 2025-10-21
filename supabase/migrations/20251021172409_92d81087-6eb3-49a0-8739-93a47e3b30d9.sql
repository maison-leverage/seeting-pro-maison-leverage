-- Drop and recreate policies for prospects
DROP POLICY IF EXISTS "Authenticated users can view all prospects" ON public.prospects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can create prospects" ON public.prospects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can update all prospects" ON public.prospects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can delete all prospects" ON public.prospects CASCADE;

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

-- Drop and recreate policies for templates
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON public.templates CASCADE;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.templates CASCADE;
DROP POLICY IF EXISTS "Authenticated users can update all templates" ON public.templates CASCADE;
DROP POLICY IF EXISTS "Authenticated users can delete all templates" ON public.templates CASCADE;

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