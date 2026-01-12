-- Supprimer l'ancienne contrainte et en créer une nouvelle qui inclut follow_up_dm
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_type_check;

ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_type_check 
CHECK (type IN ('message_sent', 'reply_received', 'call_booked', 'deal_closed', 'first_dm', 'follow_up_dm'));