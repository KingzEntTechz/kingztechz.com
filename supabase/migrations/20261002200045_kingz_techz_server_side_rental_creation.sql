/*
# Server-side rental creation

1. New function
- `create_rental(p_tool_id, p_payment_method, p_transaction_code, p_anydesk_id, p_ultraviewer_id, p_ultraviewer_password)`
  creates a rental for the signed-in caller. The tool name and both prices are read from the
  `tools` table, the status is always `pending`, and the owner comes from the session.
- The function refuses callers whose profile is disabled and tools that are not active.

2. Security changes
- Direct INSERT on `rentals` is revoked from `authenticated`, so prices and statuses can no
  longer be supplied by the browser.

3. Notes
1. Existing rentals are untouched.
2. The checkout screen must call `create_rental` instead of inserting into the table.
*/

CREATE OR REPLACE FUNCTION public.create_rental(
  p_tool_id uuid,
  p_payment_method text,
  p_transaction_code text,
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
  v_rate numeric;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_disabled = true) THEN
    RAISE EXCEPTION 'Account disabled';
  END IF;

  SELECT * INTO v_tool FROM tools WHERE id = p_tool_id AND is_active = true;
  IF v_tool.id IS NULL THEN RAISE EXCEPTION 'Tool unavailable'; END IF;

  IF p_payment_method IS NULL OR btrim(p_payment_method) = '' THEN
    RAISE EXCEPTION 'Payment method required';
  END IF;
  IF p_transaction_code IS NULL OR btrim(p_transaction_code) = '' THEN
    RAISE EXCEPTION 'Transaction code required';
  END IF;

  SELECT COALESCE(usdt_rate, 0) INTO v_rate FROM site_settings WHERE id = 1;

  INSERT INTO rentals (
    user_id, tool_id, tool_name, status, payment_method, transaction_code,
    amount_usd, amount_kes, anydesk_id, ultraviewer_id, ultraviewer_password
  ) VALUES (
    auth.uid(), v_tool.id, v_tool.name, 'pending',
    left(btrim(p_payment_method), 40), left(btrim(p_transaction_code), 120),
    v_tool.price_usd,
    CASE WHEN COALESCE(v_tool.price_kes, 0) > 0 THEN v_tool.price_kes
         ELSE round(v_tool.price_usd * COALESCE(v_rate, 0), 2) END,
    CASE WHEN v_tool.remote_connect = 'anydesk' THEN left(COALESCE(p_anydesk_id, ''), 120) ELSE '' END,
    CASE WHEN v_tool.remote_connect = 'ultraviewer' THEN left(COALESCE(p_ultraviewer_id, ''), 120) ELSE '' END,
    CASE WHEN v_tool.remote_connect = 'ultraviewer' THEN left(COALESCE(p_ultraviewer_password, ''), 120) ELSE '' END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.create_rental(uuid, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.create_rental(uuid, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_rental(uuid, text, text, text, text, text) TO authenticated;

REVOKE INSERT ON public.rentals FROM authenticated;
DROP POLICY IF EXISTS "insert_own_rentals" ON public.rentals;
