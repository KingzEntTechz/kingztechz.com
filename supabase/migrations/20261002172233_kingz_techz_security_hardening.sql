/*
# Kingz Techz - Final Function Grant Cleanup

1. Security Changes
- Remove every default privilege from the internal `is_admin()` and `handle_new_user()` SECURITY DEFINER functions.
- Restore only the authenticated execution required by existing administrator-only row policies for `is_admin()`.

2. Important Notes
- The signup trigger still invokes `handle_new_user()` internally.
- No application data or user access flow is removed.
*/

REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
