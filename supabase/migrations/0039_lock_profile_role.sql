-- 0039: Stop customers from promoting themselves to admin.
--
-- Before this migration the "Users update own profile" policy (0000:142) let any
-- signed-in user run
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', <own id>)
-- straight from the browser with the anon key, and is_admin() (0000:133) would
-- then trust that row. This closes it in three independent layers:
--   1. Column privileges: authenticated may only UPDATE full_name, phone,
--      saved_addresses. role / razorpay_customer_id / created_at are not writable.
--   2. Policy gets an explicit WITH CHECK so a row can't be re-pointed at another id.
--   3. A BEFORE UPDATE trigger rejects any role change not made by a privileged
--      database role (service_role, postgres, supabase_admin), even if a future
--      migration re-grants the column by mistake.
-- Role changes now go through the service-role client in setUserRole()
-- (src/actions/admin.ts) after assertAdmin().

-- 1) Minimal grants -----------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, saved_addresses) ON public.profiles TO authenticated;

-- 2) Policy with WITH CHECK -----------------------------------------------------
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 3) Trigger guard ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'ROLE_CHANGE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'PROFILE_ID_CHANGE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- 4) Harden is_admin(): pinned search_path, initplan-friendly auth.uid() ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
