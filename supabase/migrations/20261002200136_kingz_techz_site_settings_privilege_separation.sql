/*
# Site settings privilege separation

1. Security changes
- The footer credit (`footer_text`) can no longer be written through the table at all. It is
  changed only by the new `main_admin_set_footer_text` function, which requires the main admin.
- Direct updates to `site_settings` now require the `main` or `manager` administrator role, so a
  support-level administrator can no longer change payment numbers or the exchange rate.
- Support-level administrators keep the branding capability they were meant to have through the
  new `admin_update_branding` function (hero text, logo, scrolling text and font size).

2. Notes
1. No settings values are changed by this migration.
2. The admin settings screen must use the two new functions for footer text and for branding
   edits made by support-level administrators.
*/

REVOKE UPDATE ON public.site_settings FROM authenticated;
GRANT UPDATE (
  scrolling_text_1, scrolling_text_2, usdt_rate, whatsapp_number, email,
  binance_id, binance_name, hero_title, hero_subtitle, server_logo_url,
  mpesa_number, scroll_font_size, updated_at
) ON public.site_settings TO authenticated;

DROP POLICY IF EXISTS "update_site_settings_admin" ON public.site_settings;
CREATE POLICY "update_site_settings_admin" ON public.site_settings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true AND admin_role IN ('main', 'manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true AND admin_role IN ('main', 'manager')));

CREATE OR REPLACE FUNCTION public.main_admin_set_footer_text(p_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true AND admin_role = 'main') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_text IS NULL OR btrim(p_text) = '' THEN RAISE EXCEPTION 'Footer text required'; END IF;
  UPDATE site_settings SET footer_text = left(btrim(p_text), 120), updated_at = now() WHERE id = 1;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.main_admin_set_footer_text(text) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.main_admin_set_footer_text(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.main_admin_set_footer_text(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_branding(
  p_hero_title text,
  p_hero_subtitle text,
  p_scrolling_text_1 text,
  p_scrolling_text_2 text,
  p_server_logo_url text,
  p_scroll_font_size integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_scroll_font_size IS NULL OR p_scroll_font_size < 12 OR p_scroll_font_size > 24 THEN
    RAISE EXCEPTION 'Invalid font size';
  END IF;
  UPDATE site_settings SET
    hero_title = left(COALESCE(p_hero_title, hero_title), 120),
    hero_subtitle = left(COALESCE(p_hero_subtitle, hero_subtitle), 200),
    scrolling_text_1 = left(COALESCE(p_scrolling_text_1, scrolling_text_1), 600),
    scrolling_text_2 = left(COALESCE(p_scrolling_text_2, scrolling_text_2), 600),
    server_logo_url = left(COALESCE(p_server_logo_url, server_logo_url), 500),
    scroll_font_size = p_scroll_font_size,
    updated_at = now()
  WHERE id = 1;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_update_branding(text, text, text, text, text, integer) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_update_branding(text, text, text, text, text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_branding(text, text, text, text, text, integer) TO authenticated;
