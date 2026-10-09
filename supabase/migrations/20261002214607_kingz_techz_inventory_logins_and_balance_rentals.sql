/*
# Tool inventory logins and balance-based rentals

1. New columns
- tools.login_email (text) — username or email for a non-remote tool
- tools.login_password (text) — password for a non-remote tool
- rentals.delivered_email (text) — login email delivered to the customer
- rentals.delivered_password (text) — login password delivered to the customer

2. Changed functions
- create_rental is replaced. It now checks the caller's balance, deducts the tool
  price from the correct currency balance, and copies inventory logins into the rental
  row for non-remote tools. Remote tools stay pending ("wait for connection").
  The old signature (with payment_method / transaction_code params) is dropped.

3. Security
- The function is SECURITY DEFINER, search_path = public, EXECUTE granted to
  authenticated only. Balance deduction happens inside the function so the customer
  cannot bypass it.

4. Notes
1. No existing data is lost. Existing rentals keep their values.
2. The frontend checkout must call the new signature (no payment_method / transaction_code).
*/

ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS login_email text NOT NULL DEFAULT '';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS login_password text NOT NULL DEFAULT '';
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS delivered_email text NOT NULL DEFAULT '';
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS delivered_password text NOT NULL DEFAULT '';

DROP FUNCTION IF EXISTS public.create_rental(uuid, text, text, text, text, text);

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

  -- Check and deduct balance
  IF v_profile.preferred_currency = 'KES' THEN
    IF v_profile.balance_kes < v_price_kes THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    UPDATE profiles SET balance_kes = balance_kes - v_price_kes WHERE id = auth.uid();
  ELSE
    IF v_profile.balance_usdt < v_price_usd THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    UPDATE profiles SET balance_usdt = balance_usdt - v_price_usd WHERE id = auth.uid();
  END IF;

  -- For non-remote tools with inventory logins, deliver them immediately
  IF v_tool.remote_connect IS NULL AND COALESCE(v_tool.login_email, '') <> '' THEN
    v_delivered_email := v_tool.login_email;
    v_delivered_password := v_tool.login_password;
    v_status := 'completed';
  ELSIF v_tool.remote_connect IS NOT NULL THEN
    -- Remote tools: customer provides connection details, waits for admin
    IF v_tool.remote_connect = 'anydesk' AND btrim(p_anydesk_id) = '' THEN
      RAISE EXCEPTION 'AnyDesk ID required';
    END IF;
    IF v_tool.remote_connect = 'ultraviewer' AND (btrim(p_ultraviewer_id) = '' OR btrim(p_ultraviewer_password) = '') THEN
      RAISE EXCEPTION 'UltraViewer details required';
    END IF;
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

  RETURN v_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.create_rental(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.create_rental(uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_rental(uuid, text, text, text) TO authenticated;
