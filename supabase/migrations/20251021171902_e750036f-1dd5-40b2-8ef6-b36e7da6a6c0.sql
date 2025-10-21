-- Enable realtime for prospects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.prospects;

-- Enable realtime for templates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;