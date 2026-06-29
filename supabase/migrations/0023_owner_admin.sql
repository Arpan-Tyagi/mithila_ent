-- Designate the store owner. arpantyagi88@gmail.com is always an admin:
--   (a) the new-user trigger grants admin the moment that email signs up, and
--   (b) the upsert below promotes the account if it already exists.
-- Everyone else keeps the default 'retail' role.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN lower(NEW.email) = 'arpantyagi88@gmail.com'
         THEN 'admin'::user_role ELSE 'retail'::user_role END
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE WHEN lower(NEW.email) = 'arpantyagi88@gmail.com'
                    THEN 'admin'::user_role ELSE public.profiles.role END;
  RETURN NEW;
END;
$$;

-- Trigger already exists (migration 0012); CREATE OR REPLACE above is enough.

-- Promote the owner now if the account already exists (and create the profile
-- row if the trigger never ran for it).
INSERT INTO public.profiles (id, role)
SELECT id, 'admin'::user_role FROM auth.users WHERE lower(email) = 'arpantyagi88@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role;
