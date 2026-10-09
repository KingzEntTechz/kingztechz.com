/*
# Kingz Techz - Admin Management, Customer Controls, and Automation Settings

1. Modified Tables
- `profiles`: add `admin_role`, `balance_usdt`, `balance_kes`, and `is_disabled`. Admin roles are `main`, `manager`, or `support`; balances and disabled status are operator-controlled.
- `site_settings`: add `scroll_font_size` for the administrator-controlled scrolling text size.

2. New Tables
- `automation_settings`: stores one administrator-controlled external tool source, whether syncing is enabled, and whether scheduled syncing is enabled.

3. Security
- Customer balances, disabled status, administrator flags, and administrator roles are not client-writable columns.
- Add SECURITY DEFINER functions for balance adjustments, customer disabling, and main-admin role assignment. Each function checks the authenticated caller's current role and validates inputs.
- Automation settings are readable and writable only by authenticated administrators.
- Existing public tool and site settings read behavior remains unchanged.

4. Important Notes
- Existing profiles become `support` only when they are already administrators; the first administrator is preserved as `main`.
- Existing balances start at zero and disabled status starts false.
- Automation stores configuration only; provider-specific tool mapping remains a separate sync step.
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_role text NOT NULL DEFAULT 'support';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_usdt numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_kes numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_admin_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_admin_role_check CHECK (admin_role IN ('main', 'manager', 'support'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_balance_usdt_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_balance_usdt_check CHECK (balance_usdt >= 0);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_balance_kes_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_balance_kes_check CHECK (balance_kes >= 0);

UPDATE public.profiles SET admin_role = 'main' WHERE is_admin = true AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE admin_role = 'main');
UPDATE public.profiles SET admin_role = 'support' WHERE is_admin = false;

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS scroll_font_size integer NOT NULL DEFAULT 16;
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_scroll_font_size_check;
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_scroll_font_size_check CHECK (scroll_font_size BETWEEN 12 AND 24);

CREATE TABLE IF NOT EXISTS public.automation_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider_url text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  cron_enabled boolean NOT NULL DEFAULT false,
  interval_minutes integer NOT NULL DEFAULT 60 CHECK (interval_minutes BETWEEN 5 AND 1440),
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_automation_settings_admin" ON public.automation_settings;
CREATE POLICY "read_automation_settings_admin" ON public.automation_settings FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "insert_automation_settings_admin" ON public.automation_settings;
CREATE POLICY "insert_automation_settings_admin" ON public.automation_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_automation_settings_admin" ON public.automation_settings;
CREATE POLICY "update_automation_settings_admin" ON public.automation_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_automation_settings_admin" ON public.automation_settings;
CREATE POLICY "delete_automation_settings_admin" ON public.automation_settings FOR DELETE TO authenticated USING (public.is_admin());
INSERT INTO public.automation_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, preferred_currency) ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_customer_balance(p_user_id uuid, p_currency text, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true AND admin_role IN ('main', 'manager')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_currency NOT IN ('USD', 'KES') OR p_amount = 0 OR p_amount < -1000000 OR p_amount > 1000000 THEN RAISE EXCEPTION 'Invalid balance adjustment'; END IF;
  IF p_currency = 'USD' THEN
    UPDATE profiles SET balance_usdt = balance_usdt + p_amount WHERE id = p_user_id AND balance_usdt + p_amount >= 0;
  ELSE
    UPDATE profiles SET balance_kes = balance_kes + p_amount WHERE id = p_user_id AND balance_kes + p_amount >= 0;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found or balance cannot be negative'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_customer_status(p_user_id uuid, p_disabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true AND admin_role IN ('main', 'manager')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE profiles SET is_disabled = p_disabled WHERE id = p_user_id AND is_admin = false;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.main_admin_set_admin_role(p_user_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true AND admin_role = 'main') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_role NOT IN ('manager', 'support') THEN RAISE EXCEPTION 'Invalid administrator role'; END IF;
  UPDATE profiles SET is_admin = true, admin_role = p_role WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_adjust_customer_balance(uuid, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_customer_balance(uuid, text, numeric) TO authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_set_customer_status(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_customer_status(uuid, boolean) TO authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.main_admin_set_admin_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.main_admin_set_admin_role(uuid, text) TO authenticated;
