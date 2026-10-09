/*
# Kingz Techz - Registration and Footer Fix

1. Changes
- Update the new-user trigger so the customer's selected USD/KES preference is saved from signup metadata.
- Keep the existing admin-managed site settings and security policies unchanged.

2. Security
- The trigger remains SECURITY DEFINER with a fixed public search_path.
- Customer currency is copied from signup metadata into the profile and does not affect permissions.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_currency, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'preferred_currency' = 'KES' THEN 'KES'
      ELSE 'USD'
    END,
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_admin = true)
  );
  RETURN NEW;
END;
$$;
