/*
# Kingz Techz - Complete Security Permission Cleanup

1. Modified Permissions
- Remove default PUBLIC execution from internal SECURITY DEFINER functions.
- Keep `is_admin()` available only to authenticated requests because existing administrator-only policies call it.
- Keep `handle_new_user()` available to the authentication trigger rather than direct API callers.

2. Security Changes
- Prevents anonymous and ordinary API callers from invoking internal privilege-checking and signup-trigger functions.
- Complements the earlier column-level profile protection that prevents customers from editing administrator flags.

3. Important Notes
- No data is changed or removed.
- Existing authentication triggers and administrator policies remain in place.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
