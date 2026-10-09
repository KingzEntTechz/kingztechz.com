/*
# Add admin inventory return and deletion actions

1. Purpose
- Let administrators return a used inventory login to available stock when a rental is taken back.
- Let administrators permanently delete an inventory login when it should no longer exist.

2. Modified Functions
- `admin_delete_tool_login(uuid)` now allows an administrator to delete either available or used login records.
- New `admin_return_tool_login(uuid)` clears the rental assignment and marks the login available again.

3. Security
- Both functions are SECURITY DEFINER with a fixed public search path.
- Both verify the caller is an administrator using the authenticated session.
- Anonymous callers cannot execute either function.

4. Data Notes
- Returning a login preserves its existing email/username and password.
- Deleting a login removes only that inventory record; rental history remains unchanged.
*/

CREATE OR REPLACE FUNCTION public.admin_delete_tool_login(p_login_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM tool_logins WHERE id = p_login_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_delete_tool_login(uuid) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_delete_tool_login(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_tool_login(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_return_tool_login(p_login_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE tool_logins
  SET status = 'available', rental_id = NULL
  WHERE id = p_login_id AND status = 'used';
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_return_tool_login(uuid) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_return_tool_login(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_return_tool_login(uuid) TO authenticated;
