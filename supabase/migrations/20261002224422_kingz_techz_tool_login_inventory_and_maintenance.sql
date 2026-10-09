/*
# Tool login inventory, tool source, maintenance mode, media gallery

1. New table: tool_logins
   - Stores up to 20 logins per tool (for Rental category, non-remote tools).
   - Each login has email/username, password, and status (available/used).
   - When a customer rents, create_rental picks the first available login,
     marks it used, and writes it into the rental row.

2. New columns on tools:
   - source: 'inventory' | 'api' (default 'inventory')

3. New column on site_settings:
   - maintenance_mode: boolean (default false)

4. Updated create_rental:
   - For inventory-sourced non-remote tools, claims an available login from
     tool_logins. If none available, raises 'Out of stock'.
   - For API-sourced tools, leaves delivered fields empty (admin fills later).
   - Old single-login fields (login_email/login_password on tools) remain for
     backwards compatibility but are no longer used for new inventory tools.

5. New function: admin_add_tool_logins — bulk insert logins for a tool.
6. New function: admin_set_maintenance_mode — toggle maintenance mode.
7. New table: media_gallery — stores uploaded images with labels.
*/

CREATE TABLE IF NOT EXISTS public.tool_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  login_email text NOT NULL DEFAULT '',
  login_password text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
  rental_id uuid REFERENCES public.rentals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'inventory' CHECK (source IN ('inventory', 'api'));
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS maintenance_mode boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.media_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;

-- tool_logins: admins full access, customers can see their own used login via rentals
DROP POLICY IF EXISTS "read_tool_logins_admin" ON public.tool_logins;
CREATE POLICY "read_tool_logins_admin" ON public.tool_logins FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "write_tool_logins_admin" ON public.tool_logins;
CREATE POLICY "write_tool_logins_admin" ON public.tool_logins FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- media_gallery: admins full access, everyone can read
DROP POLICY IF EXISTS "read_media_gallery" ON public.media_gallery;
CREATE POLICY "read_media_gallery" ON public.media_gallery FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "write_media_gallery_admin" ON public.media_gallery;
CREATE POLICY "write_media_gallery_admin" ON public.media_gallery FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

GRANT SELECT ON public.media_gallery TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_logins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_gallery TO authenticated;

-- Admin function to add logins in bulk
CREATE OR REPLACE FUNCTION public.admin_add_tool_logins(p_tool_id uuid, p_logins jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_login jsonb;
  v_existing integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT count(*) INTO v_existing FROM tool_logins WHERE tool_id = p_tool_id;
  IF v_existing + jsonb_array_length(p_logins) > 20 THEN
    RAISE EXCEPTION 'Maximum 20 logins per tool';
  END IF;
  FOR v_login IN SELECT jsonb_array_elements(p_logins) LOOP
    INSERT INTO tool_logins (tool_id, login_email, login_password)
    VALUES (p_tool_id, v_login->>'email', v_login->>'password');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_add_tool_logins(uuid, jsonb) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_add_tool_logins(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_add_tool_logins(uuid, jsonb) TO authenticated;

-- Admin function to delete a single login
CREATE OR REPLACE FUNCTION public.admin_delete_tool_login(p_login_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM tool_logins WHERE id = p_login_id AND status = 'available';
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_delete_tool_login(uuid) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_delete_tool_login(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_tool_login(uuid) TO authenticated;

-- Maintenance mode toggle
CREATE OR REPLACE FUNCTION public.admin_set_maintenance_mode(p_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE site_settings SET maintenance_mode = p_enabled, updated_at = now() WHERE id = 1;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_set_maintenance_mode(boolean) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_set_maintenance_mode(boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_maintenance_mode(boolean) TO authenticated;

-- Replace create_rental to use tool_logins inventory
DROP FUNCTION IF EXISTS public.create_rental(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.create_rental(
  p_tool_id uuid,
  p_anydesk_id text DEFAULT '',
  p_ultraviewer_id text DEFAULT '',
  p_ultraviewer_password text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tool tools;
  v_profile profiles;
  v_rate numeric;
  v_id uuid;
  v_price_usd numeric;
  v_price_kes numeric;
  v_delivered_email text := '';
  v_delivered_password text := '';
  v_status text := 'pending';
  v_login_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_profile.is_disabled THEN RAISE EXCEPTION 'Account disabled'; END IF;

  SELECT * INTO v_tool FROM tools WHERE id = p_tool_id AND is_active = true;
  IF v_tool.id IS NULL THEN RAISE EXCEPTION 'Tool unavailable'; END IF;

  v_price_usd := v_tool.price_usd;
  SELECT COALESCE(usdt_rate, 0) INTO v_rate FROM site_settings WHERE id = 1;
  v_price_kes := CASE WHEN COALESCE(v_tool.price_kes, 0) > 0 THEN v_tool.price_kes
                      ELSE round(v_price_usd * COALESCE(v_rate, 0), 2) END;

  IF v_profile.preferred_currency = 'KES' THEN
    IF v_profile.balance_kes < v_price_kes THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    UPDATE profiles SET balance_kes = balance_kes - v_price_kes WHERE id = auth.uid();
  ELSE
    IF v_profile.balance_usdt < v_price_usd THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    UPDATE profiles SET balance_usdt = balance_usdt - v_price_usd WHERE id = auth.uid();
  END IF;

  IF v_tool.remote_connect IS NOT NULL THEN
    IF v_tool.remote_connect = 'anydesk' AND btrim(p_anydesk_id) = '' THEN
      RAISE EXCEPTION 'AnyDesk ID required';
    END IF;
    IF v_tool.remote_connect = 'ultraviewer' AND (btrim(p_ultraviewer_id) = '' OR btrim(p_ultraviewer_password) = '') THEN
      RAISE EXCEPTION 'UltraViewer details required';
    END IF;
    v_status := 'pending';
  ELSIF v_tool.source = 'inventory' THEN
    -- Claim an available login atomically
    SELECT id, login_email, login_password INTO v_login_id, v_delivered_email, v_delivered_password
    FROM tool_logins WHERE tool_id = v_tool.id AND status = 'available'
    ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF v_login_id IS NULL THEN
      RAISE EXCEPTION 'Out of stock';
    END IF;
    UPDATE tool_logins SET status = 'used' WHERE id = v_login_id;
    v_status := 'completed';
  ELSE
    -- API source: admin will fill in logins later
    v_status := 'pending';
  END IF;

  INSERT INTO rentals (
    user_id, tool_id, tool_name, status, payment_method, transaction_code,
    amount_usd, amount_kes, anydesk_id, ultraviewer_id, ultraviewer_password,
    delivered_email, delivered_password
  ) VALUES (
    auth.uid(), v_tool.id, v_tool.name, v_status,
    'balance', '',
    v_price_usd, v_price_kes,
    CASE WHEN v_tool.remote_connect = 'anydesk' THEN left(COALESCE(p_anydesk_id, ''), 120) ELSE '' END,
    CASE WHEN v_tool.remote_connect = 'ultraviewer' THEN left(COALESCE(p_ultraviewer_id, ''), 120) ELSE '' END,
    CASE WHEN v_tool.remote_connect = 'ultraviewer' THEN left(COALESCE(p_ultraviewer_password, ''), 120) ELSE '' END,
    v_delivered_email, v_delivered_password
  )
  RETURNING id INTO v_id;

  IF v_login_id IS NOT NULL THEN
    UPDATE tool_logins SET rental_id = v_id WHERE id = v_login_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.create_rental(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.create_rental(uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_rental(uuid, text, text, text) TO authenticated;
