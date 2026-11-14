CREATE OR REPLACE FUNCTION public.admin_search_vip_accounts(search_query text)
RETURNS TABLE (
  user_id uuid,
  email text,
  usernames text[],
  status text,
  current_period_end timestamptz,
  payment_provider text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    auth_user.id AS user_id,
    auth_user.email::text AS email,
    COALESCE(
      array_agg(DISTINCT bio_profile.username ORDER BY bio_profile.username)
        FILTER (WHERE bio_profile.username IS NOT NULL),
      ARRAY[]::text[]
    ) AS usernames,
    subscription.status,
    subscription.current_period_end,
    subscription.payment_provider
  FROM auth.users AS auth_user
  LEFT JOIN public.bio_profiles AS bio_profile
    ON bio_profile.user_id = auth_user.id
  LEFT JOIN public.vip_subscriptions AS subscription
    ON subscription.user_id = auth_user.id
  WHERE
    strpos(lower(COALESCE(auth_user.email, '')), lower(trim(search_query))) > 0
    OR EXISTS (
      SELECT 1
      FROM public.bio_profiles AS matching_profile
      WHERE matching_profile.user_id = auth_user.id
        AND strpos(lower(matching_profile.username), lower(trim(search_query))) > 0
    )
  GROUP BY
    auth_user.id,
    auth_user.email,
    subscription.status,
    subscription.current_period_end,
    subscription.payment_provider
  ORDER BY lower(COALESCE(auth_user.email, ''))
  LIMIT 25;
$$;

REVOKE ALL ON FUNCTION public.admin_search_vip_accounts(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_vip_accounts(text) TO service_role;
