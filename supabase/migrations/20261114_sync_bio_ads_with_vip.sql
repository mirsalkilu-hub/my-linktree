CREATE OR REPLACE FUNCTION public.sync_bio_ads_with_vip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vip_is_active boolean;
BEGIN
  vip_is_active := COALESCE(
    NEW.status IN ('active', 'trialing')
    AND NEW.current_period_end > now(),
    false
  );

  UPDATE public.bio_profiles
  SET ads_enabled = NOT vip_is_active
  WHERE user_id = NEW.user_id
    AND ads_enabled IS DISTINCT FROM (NOT vip_is_active);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_bio_ads_with_vip ON public.vip_subscriptions;
CREATE TRIGGER sync_bio_ads_with_vip
  AFTER INSERT OR UPDATE OF status, current_period_end ON public.vip_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bio_ads_with_vip();

UPDATE public.bio_profiles AS profile
SET ads_enabled = NOT EXISTS (
  SELECT 1
  FROM public.vip_subscriptions AS subscription
  WHERE subscription.user_id = profile.user_id
    AND subscription.status IN ('active', 'trialing')
    AND subscription.current_period_end > now()
);
