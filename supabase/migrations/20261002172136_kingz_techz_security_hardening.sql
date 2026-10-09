/*
# Kingz Techz - Security Hardening

1. Modified Permissions
- `profiles`: authenticated users may update only `full_name`, `phone`, and `preferred_currency`; administrator flags remain server-controlled.
- `handle_new_user()`: no direct API execution for anonymous or authenticated clients; it remains available to the auth trigger.
- `is_admin()`: anonymous API execution is revoked while authenticated execution remains available for existing administrator-only RLS policies.

2. Security Changes
- Prevents a customer from changing `is_admin` through a direct database request.
- Prevents public RPC calls to internal SECURITY DEFINER helper functions.
- Preserves the existing signup trigger and administrator checks.

3. Important Notes
- No rows or columns are deleted.
- Existing profiles, tools, rentals, and settings remain unchanged.
*/

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, preferred_currency) ON TABLE public.profiles TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
