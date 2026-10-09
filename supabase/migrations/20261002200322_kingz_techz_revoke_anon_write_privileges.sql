/*
# Remove unused public write privileges

1. Security changes
- The signed-out (`anon`) role keeps read access only. Its unused INSERT, UPDATE and DELETE
  privileges on tools, rentals, profiles, site settings and automation settings are revoked, so
  row level security is no longer the only thing standing between a visitor and a write.

2. Notes
1. The application never writes while signed out, so no feature depends on these privileges.
2. Signup still works: the profile row is created by a trigger that runs with elevated rights.
*/

REVOKE INSERT, UPDATE, DELETE ON public.tools FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.rentals FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.site_settings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.automation_settings FROM anon;
