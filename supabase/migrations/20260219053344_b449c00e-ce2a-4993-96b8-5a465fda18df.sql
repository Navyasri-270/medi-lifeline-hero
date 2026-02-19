
-- Fix: profiles table - recreate policies with explicit authenticated role restriction
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Fix: emergency_contacts table - recreate policies with explicit authenticated role restriction
DROP POLICY IF EXISTS "Users can view own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.emergency_contacts;

CREATE POLICY "Users can view own contacts"
  ON public.emergency_contacts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON public.emergency_contacts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON public.emergency_contacts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON public.emergency_contacts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
