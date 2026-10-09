/*
# Protect tool login inventory access

1. Purpose
- Prevent anonymous browser requests from reading or modifying stored tool login credentials.
- Keep the administrator inventory screen able to read login rows.
- Keep login creation, deletion, and return-to-inventory operations on the existing protected admin functions.

2. Modified table
- `public.tool_logins`
- Anonymous table privileges are removed completely.
- Authenticated browser users receive SELECT only, subject to the administrator row policy.
- Direct INSERT, UPDATE, and DELETE table privileges are removed from browser roles because those mutations already use SECURITY DEFINER admin functions.

3. Security policies
- Replace the combined write policy with separate SELECT, INSERT, UPDATE, and DELETE policies.
- All policies require an authenticated administrator through `is_admin()`.
- The INSERT, UPDATE, and DELETE policies remain deny-by-privilege for browser roles because the matching table privileges are revoked; the protected admin functions perform the legitimate mutations.

4. Data safety
- No rows, tables, or columns are deleted.
- Existing inventory credentials and their rental status remain unchanged.
*/

REVOKE ALL PRIVILEGES ON TABLE public.tool_logins FROM anon, authenticated;
GRANT SELECT ON TABLE public.tool_logins TO authenticated;

DROP POLICY IF EXISTS "write_tool_logins_admin" ON public.tool_logins;
DROP POLICY IF EXISTS "select_tool_logins_admin" ON public.tool_logins;
DROP POLICY IF EXISTS "insert_tool_logins_admin" ON public.tool_logins;
DROP POLICY IF EXISTS "update_tool_logins_admin" ON public.tool_logins;
DROP POLICY IF EXISTS "delete_tool_logins_admin" ON public.tool_logins;
DROP POLICY IF EXISTS "read_tool_logins_admin" ON public.tool_logins;

CREATE POLICY "select_tool_logins_admin"
ON public.tool_logins FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "insert_tool_logins_admin"
ON public.tool_logins FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "update_tool_logins_admin"
ON public.tool_logins FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "delete_tool_logins_admin"
ON public.tool_logins FOR DELETE
TO authenticated
USING (is_admin());

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_add_tool_logins(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_tool_logins(uuid, jsonb) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_delete_tool_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_tool_login(uuid) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_return_tool_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_return_tool_login(uuid) TO authenticated;
