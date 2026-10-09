/*
# Kingz Techz - Media Gallery and Logo Storage

1. Modified Tables
- `site_settings`: add `server_logo_url` for the main server logo selected by the administrator.

2. New Storage
- `media` bucket stores administrator-uploaded website and tool images.
- The bucket is public for reading because these images are intentionally displayed on the public storefront.
- Only authenticated administrators can upload, replace, or delete media files.

3. Security
- Storage write policies require `public.is_admin()`.
- Public read access is limited to the intentional public media bucket.
- Upload controls remain administrator-only in the interface.

4. Important Notes
- Existing tool image URLs are preserved.
- New tool images can be uploaded from the admin form and saved as media URLs.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS server_logo_url text NOT NULL DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
CREATE POLICY "public_read_media" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "admin_insert_media" ON storage.objects;
CREATE POLICY "admin_insert_media" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "admin_update_media" ON storage.objects;
CREATE POLICY "admin_update_media" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND public.is_admin())
WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_media" ON storage.objects;
CREATE POLICY "admin_delete_media" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND public.is_admin());
