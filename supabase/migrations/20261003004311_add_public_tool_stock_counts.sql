/*
# Add public tool stock counts

1. Purpose
- Provide the storefront with inventory availability without exposing login emails or passwords.
- Customers need only the number of available logins for each tool.

2. New Function
- `get_public_tool_stock()` returns each tool ID and its count of available inventory logins.

3. Security
- The function runs with controlled definer privileges and a fixed `public` search path.
- Anonymous and authenticated visitors may execute it because the result contains counts only.
- No `tool_logins` rows or credential columns are exposed to customers.
*/

CREATE OR REPLACE FUNCTION public.get_public_tool_stock()
RETURNS TABLE (tool_id uuid, available_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tl.tool_id, count(*)::integer
  FROM public.tool_logins AS tl
  WHERE tl.status = 'available'
  GROUP BY tl.tool_id;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_public_tool_stock() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tool_stock() TO anon, authenticated;
