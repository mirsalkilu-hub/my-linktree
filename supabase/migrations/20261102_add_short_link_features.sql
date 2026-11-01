CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  verification_token text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_domains_domain_format
    CHECK (domain = lower(domain) AND domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$')
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_domains TO service_role;

CREATE POLICY "Users manage their custom domains"
  ON public.custom_domains
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS custom_domain_id uuid
    REFERENCES public.custom_domains(id) ON DELETE SET NULL;

ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS password_protected boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS links_custom_domain_id_idx
  ON public.links(custom_domain_id);

CREATE TABLE IF NOT EXISTS public.short_link_protection (
  link_id uuid PRIMARY KEY REFERENCES public.links(id) ON DELETE CASCADE,
  password_hash text NOT NULL
);

ALTER TABLE public.short_link_protection ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.short_link_protection FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.short_link_protection TO service_role;

CREATE TABLE IF NOT EXISTS public.short_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
);

CREATE INDEX IF NOT EXISTS short_link_clicks_link_time_idx
  ON public.short_link_clicks(link_id, clicked_at DESC);

ALTER TABLE public.short_link_clicks ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.short_link_clicks TO authenticated;

CREATE POLICY "Users read analytics for their short links"
  ON public.short_link_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.links
      WHERE links.id = short_link_clicks.link_id
        AND links.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.short_link_password_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  short_code text NOT NULL,
  ip_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS short_link_password_attempts_lookup_idx
  ON public.short_link_password_attempts(short_code, ip_hash, attempted_at DESC);

ALTER TABLE public.short_link_password_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.short_link_password_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.short_link_password_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.record_short_link_click(
  p_link_id uuid,
  p_referrer_host text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  WITH updated_link AS (
    UPDATE public.links
    SET clicks = COALESCE(clicks, 0) + 1
    WHERE id = p_link_id
      AND (expires_at IS NULL OR expires_at > now())
    RETURNING id, utm_source, utm_medium, utm_campaign, utm_content, utm_term
  )
  INSERT INTO public.short_link_clicks (
    link_id,
    referrer_host,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term
  )
  SELECT
    id,
    LEFT(p_referrer_host, 253),
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term
  FROM updated_link;
END;
$$;

REVOKE ALL ON FUNCTION public.record_short_link_click(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_short_link_click(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_short_link_analytics(
  p_user_id uuid,
  p_since timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH user_clicks AS (
    SELECT clicks.clicked_at, clicks.referrer_host, clicks.utm_campaign
    FROM public.short_link_clicks AS clicks
    JOIN public.links AS links ON links.id = clicks.link_id
    WHERE links.user_id = p_user_id
      AND clicks.clicked_at >= p_since
  ),
  daily AS (
    SELECT date_trunc('day', clicked_at)::date AS day, count(*) AS clicks
    FROM user_clicks
    GROUP BY 1
  ),
  campaigns AS (
    SELECT COALESCE(NULLIF(utm_campaign, ''), 'Unattributed') AS name, count(*) AS clicks
    FROM user_clicks
    GROUP BY 1
  ),
  referrers AS (
    SELECT COALESCE(NULLIF(referrer_host, ''), 'Direct') AS name, count(*) AS clicks
    FROM user_clicks
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'totalClicks', (SELECT count(*) FROM user_clicks),
    'daily', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('date', day, 'clicks', clicks) ORDER BY day) FROM daily),
      '[]'::jsonb
    ),
    'campaigns', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('name', name, 'clicks', clicks) ORDER BY clicks DESC) FROM campaigns),
      '[]'::jsonb
    ),
    'referrers', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('name', name, 'clicks', clicks) ORDER BY clicks DESC) FROM referrers),
      '[]'::jsonb
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_short_link_analytics(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_short_link_analytics(uuid, timestamptz) TO service_role;
