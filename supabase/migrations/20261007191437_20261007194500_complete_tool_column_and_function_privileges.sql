/*
# Complete tool credential and helper privilege restrictions

1. Purpose
- Ensure table-wide SELECT grants cannot re-expose stored tool credentials.
- Remove inherited PUBLIC execution from the internal email-confirmation helper.

2. Modified table privileges
- `tools`: replace broad SELECT grants for `anon` and `authenticated` with an allowlist of public catalog columns. Credential columns remain available only to trusted server-side administrative paths, not browser roles.

3. Security changes
- `login_email` and `login_password` are excluded from browser-readable columns.
- `is_email_confirmed(uuid)` is no longer executable by PUBLIC, anon, or authenticated clients.
- `get_public_tool_stock()` remains public because the customer catalog intentionally displays availability counts; it returns counts only and exposes no login data.

4. Data safety
- No rows, tables, or columns are deleted.
*/

REVOKE SELECT ON TABLE public.tools FROM anon, authenticated;
GRANT SELECT (id, name, description, image_url, duration, price_usd, price_kes, category, is_active, sort_order, remote_connect, delivery_mode, source, created_at, updated_at) ON TABLE public.tools TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_email_confirmed(uuid) FROM PUBLIC, anon, authenticated;
