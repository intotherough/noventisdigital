-- Manual migration. NOT run by the schema workflow.
--
-- Wires the portal-notifications edge function to fire whenever a row
-- is inserted into public.portal_audit_logs. The trigger function uses
-- pg_net directly rather than the supabase_functions wrapper so it
-- works even on projects that never had Database Webhooks initialised
-- via the dashboard.
--
-- Apply via Supabase SQL editor or management API after setting the
-- WEBHOOK_SECRET env var on the portal-notifications edge function to
-- the same value you embed below. Replace <WEBHOOK_SECRET> before
-- running.

create extension if not exists pg_net;

create or replace function public.portal_audit_notify()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $fn$
begin
  perform net.http_post(
    url := 'https://ainqsfmgtanpabuaofzm.supabase.co/functions/v1/portal-notifications',
    headers := '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'portal_audit_logs',
      'schema', 'public',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$fn$;

drop trigger if exists portal_audit_log_notify on public.portal_audit_logs;

create trigger portal_audit_log_notify
after insert on public.portal_audit_logs
for each row
execute function public.portal_audit_notify();
