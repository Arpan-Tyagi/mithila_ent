-- 0047: RLS-06. Admin role comes from public.user_roles (CLAUDE.md invariant 2),
-- exposed in the JWT by custom_access_token_hook. Never from user_metadata,
-- never from sign-up data (SEC-13 closed in 0046: handle_new_user is retail-only).
--
--   * public.user_roles: source of truth. RLS on, no API-role access at all;
--     only service_role writes it, only supabase_auth_admin (the hook) reads it.
--   * Mirror trigger: user_roles -> profiles.role, so existing readers of
--     profiles.role stay correct. profiles.role can no longer be changed any
--     other way (not even by postgres/service_role), so the two cannot drift.
--   * is_admin() reads user_roles.
--   * Five policies that inlined "EXISTS (profiles.role = 'admin')" now call
--     (SELECT public.is_admin()).
--   * custom_access_token_hook adds a `user_role` claim. It must be switched on
--     in the dashboard: Authentication > Hooks > Customize Access Token
--     > public.custom_access_token_hook.

-- ---------------------------------------------------------------------------
-- A) Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.user_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO service_role;

-- The access-token hook runs as supabase_auth_admin.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
DROP POLICY IF EXISTS "Auth hook reads roles" ON public.user_roles;
CREATE POLICY "Auth hook reads roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO supabase_auth_admin
  USING (true);

-- ---------------------------------------------------------------------------
-- B) profiles.role guard: role changes only through the user_roles mirror.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(current_setting('app.user_roles_sync', true), '') <> 'on' THEN
    RAISE EXCEPTION 'ROLE_CHANGE_FORBIDDEN: change roles in public.user_roles'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'PROFILE_ID_CHANGE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_profile_role_change() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- C) Mirror user_roles -> profiles.role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid;
  v_role public.user_role;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user := OLD.user_id;
    v_role := 'retail'::public.user_role;
  ELSE
    v_user := NEW.user_id;
    v_role := NEW.role;
  END IF;

  PERFORM set_config('app.user_roles_sync', 'on', true);
  UPDATE public.profiles SET role = v_role WHERE id = v_user AND role IS DISTINCT FROM v_role;
  PERFORM set_config('app.user_roles_sync', 'off', true);

  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    PERFORM set_config('app.user_roles_sync', 'on', true);
    UPDATE public.profiles SET role = 'retail'::public.user_role
     WHERE id = OLD.user_id AND role IS DISTINCT FROM 'retail'::public.user_role;
    PERFORM set_config('app.user_roles_sync', 'off', true);
  END IF;

  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

-- ---------------------------------------------------------------------------
-- D) Seed from current admins (by user id; no e-mail anywhere).
--    profiles.role already says admin for these, so the mirror is a no-op.
-- ---------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::public.user_role
  FROM public.profiles p
 WHERE p.role = 'admin'::public.user_role
   AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- E) is_admin() reads user_roles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
     WHERE ur.user_id = (SELECT auth.uid())
       AND ur.role = 'admin'::public.user_role
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F) Policies that inlined the profiles.role lookup
-- ---------------------------------------------------------------------------
ALTER POLICY "Admins can manage collections" ON public.collections
  USING ((SELECT public.is_admin()));
ALTER POLICY "Admins can manage product collections" ON public.product_collections
  USING ((SELECT public.is_admin()));
ALTER POLICY "Admins can view contact inquiries" ON public.contact_inquiries
  USING ((SELECT public.is_admin()));
ALTER POLICY "Admins can view wholesale applications" ON public.wholesale_applications
  USING ((SELECT public.is_admin()));
ALTER POLICY "Admins can update wholesale applications" ON public.wholesale_applications
  USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- G) Access-token hook
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_claims jsonb;
  v_role   public.user_role;
BEGIN
  SELECT ur.role INTO v_role
    FROM public.user_roles ur
   WHERE ur.user_id = (event ->> 'user_id')::uuid;

  v_claims := COALESCE(event -> 'claims', '{}'::jsonb);
  v_claims := jsonb_set(v_claims, '{user_role}',
                        to_jsonb(COALESCE(v_role, 'retail'::public.user_role)::text));
  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;
REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
