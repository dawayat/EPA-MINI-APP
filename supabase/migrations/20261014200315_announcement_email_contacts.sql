-- Email-only recipients do not grant membership, portal access, or voting rights.
CREATE TABLE IF NOT EXISTS public.announcement_email_contacts (
  email text PRIMARY KEY CHECK (email = lower(btrim(email))),
  display_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcement_email_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.announcement_email_contacts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.announcement_email_contacts TO service_role;
NOTIFY pgrst, 'reload schema';
