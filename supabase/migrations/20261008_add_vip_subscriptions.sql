CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL,
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.vip_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.vip_subscriptions TO authenticated;
GRANT ALL ON public.vip_subscriptions TO service_role;

CREATE POLICY "Users can read their own VIP subscription"
  ON public.vip_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enforce_vip_ads_setting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ads_enabled IS FALSE AND NOT EXISTS (
    SELECT 1
    FROM public.vip_subscriptions
    WHERE user_id = NEW.user_id
      AND status IN ('active', 'trialing')
      AND current_period_end > now()
  ) THEN
    RAISE EXCEPTION 'An active VIP subscription is required to disable ads.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vip_ads_setting ON public.bio_profiles;
CREATE TRIGGER enforce_vip_ads_setting
  BEFORE INSERT OR UPDATE OF ads_enabled ON public.bio_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_vip_ads_setting();

UPDATE public.bio_profiles
SET ads_enabled = true
WHERE ads_enabled IS FALSE;
