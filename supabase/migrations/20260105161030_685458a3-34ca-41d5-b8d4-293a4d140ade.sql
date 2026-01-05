-- Create activity_logs table for tracking performance
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('message_sent', 'reply_received', 'call_booked', 'deal_closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_name TEXT NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view all activity logs"
ON public.activity_logs FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their activity logs"
ON public.activity_logs FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;