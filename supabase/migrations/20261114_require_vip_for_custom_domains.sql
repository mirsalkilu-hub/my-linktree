DROP POLICY IF EXISTS "Users manage their custom domains" ON public.custom_domains;

CREATE POLICY "Users read their custom domains"
  ON public.custom_domains
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "VIP users create custom domains"
  ON public.custom_domains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.vip_subscriptions
      WHERE user_id = auth.uid()
        AND status IN ('active', 'trialing')
        AND current_period_end > now()
    )
  );

CREATE POLICY "Users update their custom domains"
  ON public.custom_domains
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their custom domains"
  ON public.custom_domains
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
