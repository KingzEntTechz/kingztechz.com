/*
# Kingz Techz - Database Schema

1. New Tables
- `profiles`: Extends auth.users with full_name, phone, is_admin flag. Auto-created on signup via trigger.
- `tools`: Rental tools inventory managed by admin. Public read, admin-only write.
- `rentals`: Rental transactions. Users see their own, admin sees all.

2. Security
- RLS enabled on all tables.
- profiles: users read/update own profile; admin can read all.
- tools: public read (anon + authenticated); admin-only insert/update/delete.
- rentals: users read/insert their own; admin can read all and update status.
- SECURITY DEFINER function `is_admin()` checks admin status safely.
- Trigger `handle_new_user` auto-creates profile on signup, first user becomes admin.

3. Important Notes
- First registered user automatically becomes admin.
- Tools are managed entirely through the admin panel (no hardcoded tools in frontend).
- Admin detection uses a SECURITY DEFINER function to bypass RLS on profiles for the admin check.
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function to check admin status (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- First user becomes admin
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_admin = true)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  duration text NOT NULL DEFAULT 'Varies',
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  price_kes numeric(10,2) NOT NULL DEFAULT 0,
  category text DEFAULT 'General',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Tools policies: public read, admin-only write
DROP POLICY IF EXISTS "read_tools" ON tools;
CREATE POLICY "read_tools" ON tools FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_tools_admin" ON tools;
CREATE POLICY "insert_tools_admin" ON tools FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_tools_admin" ON tools;
CREATE POLICY "update_tools_admin" ON tools FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_tools_admin" ON tools;
CREATE POLICY "delete_tools_admin" ON tools FOR DELETE
  TO authenticated USING (public.is_admin());

-- Create rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid REFERENCES tools(id) ON DELETE SET NULL,
  tool_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'expired', 'cancelled')),
  payment_method text DEFAULT '',
  transaction_code text DEFAULT '',
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  amount_kes numeric(10,2) NOT NULL DEFAULT 0,
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Rentals policies: users see/insert their own, admin sees all and can update
DROP POLICY IF EXISTS "select_own_rentals" ON rentals;
CREATE POLICY "select_own_rentals" ON rentals FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_rentals" ON rentals;
CREATE POLICY "insert_own_rentals" ON rentals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rentals" ON rentals;
CREATE POLICY "update_own_rentals" ON rentals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_rentals" ON rentals;
CREATE POLICY "admin_update_rentals" ON rentals FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_rentals" ON rentals;
CREATE POLICY "admin_delete_rentals" ON rentals FOR DELETE
  TO authenticated USING (public.is_admin());

-- Add index on user_id for rentals
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_tools_active ON tools(is_active);
