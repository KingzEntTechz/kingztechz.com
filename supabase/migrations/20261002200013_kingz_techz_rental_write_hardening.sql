/*
# Rental write hardening

1. Security changes
- Customers can no longer change the status, amounts or admin notes of their own rentals.
  Table-wide UPDATE on `rentals` is revoked from `authenticated` and re-granted only on the
  contact columns a customer legitimately corrects, and only while the order is still pending.
- Admin status changes move into the SECURITY DEFINER function `admin_set_rental_status`,
  which verifies the caller is an administrator.

2. Notes
1. No data is deleted or altered; only privileges and policies change.
2. The admin panel must call `admin_set_rental_status` instead of updating the table directly.
*/

REVOKE UPDATE ON public.rentals FROM authenticated;
GRANT UPDATE (transaction_code, anydesk_id, ultraviewer_id, ultraviewer_password, updated_at)
  ON public.rentals TO authenticated;

DROP POLICY IF EXISTS "update_own_rentals" ON public.rentals;
CREATE POLICY "update_own_rentals" ON public.rentals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE OR REPLACE FUNCTION public.admin_set_rental_status(p_rental_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('pending', 'paid', 'completed', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE rentals SET status = p_status, updated_at = now() WHERE id = p_rental_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rental not found'; END IF;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.admin_set_rental_status(uuid, text) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.admin_set_rental_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_rental_status(uuid, text) TO authenticated;
