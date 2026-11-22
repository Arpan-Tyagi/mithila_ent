-- 0042: Only the server can read or change the login lockout (audit SEC-02).
--
-- Before this migration the three auth_attempt_* functions were EXECUTE-able by
-- anon. With the public anon key anyone could:
--   * call auth_attempt_record_failure(email, 1, 525600) once and lock any
--     account, the owner's included, out of password login for a year (the
--     caller chose both the threshold and the lock length);
--   * call auth_attempt_clear(email) between guesses, so the lockout never
--     slowed a password-guessing attack.
--
-- Now:
--   * The functions are EXECUTE-able by service_role only. src/actions/auth.ts
--     calls them with the service-role client after the visitor submits the
--     login form.
--   * The threshold (5 failures within 15 minutes) and the lock length
--     (15 minutes) are fixed inside the function.
--   * An expired lock or a quiet 15-minute window starts a fresh count, so a
--     past lock does not re-lock the account on the next typo.
--   * anon and authenticated have no table privileges on auth_attempts.

REVOKE ALL ON TABLE public.auth_attempts FROM anon, authenticated;

-- Any lock longer than the new maximum was not set by the app's login form.
UPDATE public.auth_attempts
   SET locked_until = now() + interval '15 minutes'
 WHERE locked_until > now() + interval '15 minutes';

DROP FUNCTION IF EXISTS public.auth_attempt_record_failure(text, integer, integer);

CREATE OR REPLACE FUNCTION public.auth_attempt_record_failure(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_max          constant integer  := 5;
  c_window       constant interval := interval '15 minutes';
  c_lock         constant interval := interval '15 minutes';
  v_email        text := lower(btrim(COALESCE(p_email, '')));
  v_id           uuid;
  v_attempts     integer;
  v_last         timestamptz;
  v_locked_until timestamptz;
BEGIN
  IF v_email = '' THEN
    RETURN jsonb_build_object('attempts', 0, 'locked', false, 'justLocked', false);
  END IF;

  SELECT id, attempts, last_attempt, locked_until
    INTO v_id, v_attempts, v_last, v_locked_until
    FROM public.auth_attempts
   WHERE email = v_email
   ORDER BY last_attempt DESC
   LIMIT 1
     FOR UPDATE;

  IF v_id IS NULL THEN
    INSERT INTO public.auth_attempts (email, attempts, last_attempt)
    VALUES (v_email, 1, now())
    RETURNING id INTO v_id;
    v_attempts := 1;
  ELSIF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    -- Already locked: do not extend the lock.
    UPDATE public.auth_attempts SET last_attempt = now() WHERE id = v_id;
    RETURN jsonb_build_object('attempts', v_attempts, 'locked', true, 'justLocked', false);
  ELSE
    IF v_locked_until IS NOT NULL OR v_last < now() - c_window THEN
      v_attempts := 1;
    ELSE
      v_attempts := v_attempts + 1;
    END IF;
    UPDATE public.auth_attempts
       SET attempts = v_attempts, last_attempt = now(), locked_until = NULL
     WHERE id = v_id;
  END IF;

  IF v_attempts >= c_max THEN
    UPDATE public.auth_attempts SET locked_until = now() + c_lock WHERE id = v_id;
    RETURN jsonb_build_object('attempts', v_attempts, 'locked', true, 'justLocked', true);
  END IF;

  RETURN jsonb_build_object('attempts', v_attempts, 'locked', false, 'justLocked', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_attempt_is_locked(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT a.locked_until > now()
      FROM public.auth_attempts a
     WHERE a.email = lower(btrim(COALESCE(p_email, '')))
     ORDER BY a.last_attempt DESC
     LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.auth_attempt_clear(p_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.auth_attempts WHERE email = lower(btrim(COALESCE(p_email, '')));
$$;

REVOKE ALL ON FUNCTION public.auth_attempt_record_failure(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_attempt_is_locked(text)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_attempt_clear(text)          FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_attempt_record_failure(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_attempt_is_locked(text)      TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_attempt_clear(text)          TO service_role;
