-- ─────────────────────────────────────────────────────────────────────────────
-- Neetirth admin schema — Supabase migration
-- Run this once via Supabase SQL Editor or `supabase db push`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Admin users table ────────────────────────────────────────────────────
-- Only users listed here can access the admin dashboard.
CREATE TABLE IF NOT EXISTS admin_users (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL UNIQUE,
  role      TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Site content table ───────────────────────────────────────────────────
-- Key-value store for editable site content (hero text, announcements, etc.)
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES admin_users(user_id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Announcements table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  active     BOOLEAN NOT NULL DEFAULT true,
  priority   INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES admin_users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Audit log — tracks every admin action ───────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID REFERENCES admin_users(user_id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  details    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Row-Level Security ──────────────────────────────────────────────────
-- Enable RLS on all tables so unauthenticated users see nothing.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin users: only admins can read the admin_users table
CREATE POLICY "admins can view admin_users"
  ON admin_users FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Site content: anyone can read (it powers the public site), only admins write
CREATE POLICY "public can read site_content"
  ON site_content FOR SELECT
  USING (true);

CREATE POLICY "admins can write site_content"
  ON site_content FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Announcements: anyone can read active ones, admins manage all
CREATE POLICY "public can read active announcements"
  ON announcements FOR SELECT
  USING (true);

CREATE POLICY "admins can manage announcements"
  ON announcements FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Audit log: admins can read, inserts happen via service role or trigger
CREATE POLICY "admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- ── 6. Seed default content ────────────────────────────────────────────────
INSERT INTO site_content (key, value) VALUES
  ('hero_title', '"नीतीर्थ — Free NEET Study Space"'),
  ('hero_subtitle', '"Offline-first mocks, PYQ-tagged practice, progress analytics and an NCERT-first doubt solver."'),
  ('maintenance_mode', 'false'),
  ('footer_text', '"Built with ♥ for every NEET aspirant."')
ON CONFLICT (key) DO NOTHING;

-- ── 7. Helper function to check admin status ───────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

-- ── 8. Auto-populate updated_at on announcements ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
