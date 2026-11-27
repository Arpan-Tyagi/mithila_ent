-- 0049: validate_discount becomes server-only (red-team finding RT-01).
--
-- validate_discount is SECURITY DEFINER and was executable by anon and
-- authenticated, so anyone with the public key could call
-- /rest/v1/rpc/validate_discount in a loop and enumerate live coupon codes,
-- their type and value, bypassing the app's rate limit. Checkout now calls it
-- through the previewDiscount server action, which requires a signed-in user,
-- rate-limits per user, and uses the service-role client.
-- create_order_atomic (service_role only, 0040) still validates every code
-- itself, so this changes no pricing.

REVOKE ALL ON FUNCTION public.validate_discount(text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_discount(text, numeric) TO service_role;
