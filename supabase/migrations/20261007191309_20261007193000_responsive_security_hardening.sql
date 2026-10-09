/*
# Responsive and data access hardening

1. Purpose
- Reduce browser exposure of stored tool credentials.
- Make media gallery writes administrator-only with separate CRUD policies.
- Remove anonymous execution from a private email-confirmation helper.

2. Modified tables and privileges
- `tools`: anonymous and authenticated clients can no longer SELECT the legacy `login_email` and `login_password` columns. The application uses explicit safe column lists for tool browsing and administration.
- `media_gallery`: replaces the combined administrator write policy with separate INSERT, UPDATE, and DELETE policies. Public read access remains intentional because gallery images are website branding assets.

3. Security changes
- Anonymous users cannot insert, update, or delete gallery records.
- Authenticated users must pass `is_admin()` for gallery writes.
- `anon` can no longer execute `is_email_confirmed(uuid)`, which is an internal helper and is not used by the browser.

4. Data safety
- No rows, tables, or columns are deleted.
- Existing media and tool records remain unchanged.
*/

REVOKE SELECT (login_email, login_password) ON TABLE public.tools FROM anon, authenticated;

DROP POLICY IF EXISTS "write_media_gallery_admin" ON public.media_gallery;
DROP POLICY IF EXISTS "insert_media_gallery_admin" ON public.media_gallery;
DROP POLICY IF EXISTS "update_media_gallery_admin" ON public.media_gallery;
DROP POLICY IF EXISTS "delete_media_gallery_admin" ON public.media_gallery;

CREATE POLICY "insert_media_gallery_admin"
ON public.media_gallery FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "update_media_gallery_admin"
ON public.media_gallery FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "delete_media_gallery_admin"
ON public.media_gallery FOR DELETE
TO authenticated
USING (is_admin());

REVOKE EXECUTE ON FUNCTION public.is_email_confirmed(uuid) FROM anon;
