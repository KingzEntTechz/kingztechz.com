/*
# Kingz Techz - Schema Updates v2

1. Changes
- `tools`: Add `remote_connect` column (null, 'anydesk', or 'ultraviewer') for remote support software.
- `profiles`: Add `preferred_currency` column ('USD' or 'KES', default 'USD') for customer currency selection.
- `site_settings`: New single-row table for admin-managed website content (scrolling texts, footer, USDT rate, contact info, hero text).

2. Security
- RLS on site_settings: public read, admin-only write.
- No changes to existing table policies.

3. Important Notes
- USDT rate set by admin determines KES pricing: KES = price_usd * usdt_rate.
- Customer selects preferred currency during registration.
- Remote connect lets admin mark tools that need AnyDesk or UltraViewer for support.
*/

-- Add remote_connect to tools
ALTER TABLE tools ADD COLUMN IF NOT EXISTS remote_connect text DEFAULT NULL CHECK (remote_connect IS NULL OR remote_connect IN ('anydesk', 'ultraviewer'));

-- Add preferred_currency to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'USD' CHECK (preferred_currency IN ('USD', 'KES'));

-- Create site_settings table (single row, id=1)
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  scrolling_text_1 text NOT NULL DEFAULT 'KINGZ_TECHZ | YOUR IT EXPERTZ | ALL DIGITAL SOLUTIONZ | COMPUTER REPAIRZ | SOFTWARE INSTALLATIONZ',
  scrolling_text_2 text NOT NULL DEFAULT 'PHONE REPAIR TOOLZ ACTIVATIONZ AND RENTALZ | WHATSAPP 0752000550 | info@kingzenttechz@gmail.com',
  footer_text text NOT NULL DEFAULT 'Kingz Techz',
  usdt_rate numeric(10,2) NOT NULL DEFAULT 129.22,
  whatsapp_number text NOT NULL DEFAULT '0752000550',
  email text NOT NULL DEFAULT 'kingzenttechz@gmail.com',
  binance_id text NOT NULL DEFAULT '1108869988',
  binance_name text NOT NULL DEFAULT 'Kingz Technologiez',
  hero_title text NOT NULL DEFAULT 'Digital Services',
  hero_subtitle text NOT NULL DEFAULT 'Technicians tools and services',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "read_site_settings" ON site_settings;
CREATE POLICY "read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

-- Admin-only write
DROP POLICY IF EXISTS "insert_site_settings_admin" ON site_settings;
CREATE POLICY "insert_site_settings_admin" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_site_settings_admin" ON site_settings;
CREATE POLICY "update_site_settings_admin" ON site_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed the single row
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
