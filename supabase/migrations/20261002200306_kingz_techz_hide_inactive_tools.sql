/*
# Hide inactive tools from the public API

1. Security changes
- The tools read policy now returns only active tools to visitors and customers.
  Administrators continue to see every tool, including hidden ones.

2. Notes
1. No tool data is changed.
2. The storefront already filtered hidden tools in the browser; this enforces it on the server.
*/

DROP POLICY IF EXISTS "read_tools" ON public.tools;
CREATE POLICY "read_tools" ON public.tools FOR SELECT
TO anon, authenticated
USING (is_active = true OR is_admin());
