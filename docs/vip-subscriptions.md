# VIP membership

VIP membership removes ads from a user's bio pages and is available through PayPal:
**$5/month** or **$50/year**. Both plans renew automatically until cancelled.
PayPal handles the billing approval and recurring payments; VIP access is granted
only after a verified PayPal webhook confirms the subscription.

## Setup

1. Apply `supabase/migrations/20261008_add_vip_subscriptions.sql` and
   `supabase/migrations/20261009_add_paypal_vip.sql` to the Supabase project.
2. In PayPal, create two subscription plans in USD: **$5 monthly** and **$50 yearly**.
   Add their plan IDs as `PAYPAL_VIP_MONTHLY_PLAN_ID` and
   `PAYPAL_VIP_ANNUAL_PLAN_ID`.
3. Configure a PayPal webhook for
   `/api/vip/paypal/webhook`, subscribe to
   `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`,
   `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.CANCELLED`, and
   `BILLING.SUBSCRIPTION.EXPIRED`, then set its ID as `PAYPAL_WEBHOOK_ID`.
4. Set `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, and the plan IDs in the deployment environment. Test with
   sandbox credentials and plans before switching to live credentials and plans.
   Keep `PAYPAL_VIP_PLAN_ID` configured only if old subscriptions on the previous
   PayPal plan still need webhook updates.
5. Deploy the app. Users can select either plan from Dashboard → VIP membership and
   complete approval on PayPal.

## Activate a verified manual payment

For an exceptional/manual payment, after confirming the payment and finding the
customer's account email, run this in the Supabase SQL Editor. Replace
`customer@example.com` with the email used for their website account. If the customer
has an existing PayPal subscription, cancel it in PayPal before switching their VIP
record to manual payment.

```sql
DO $$
DECLARE
  target_user uuid;
BEGIN
  SELECT id INTO target_user
  FROM auth.users
  WHERE email = 'customer@example.com';

  IF target_user IS NULL THEN
    RAISE EXCEPTION 'No account found for customer@example.com';
  END IF;

  INSERT INTO public.vip_subscriptions (
    user_id,
    status,
    payment_provider,
    current_period_end,
    updated_at,
    paypal_subscription_id,
    paypal_payer_id
  )
  VALUES (
    target_user,
    'active',
    'manual',
    now() + interval '1 year',
    now(),
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET status = EXCLUDED.status,
      payment_provider = 'manual',
      current_period_end = GREATEST(
        COALESCE(vip_subscriptions.current_period_end, now()),
        now()
      ) + interval '1 year',
      updated_at = now(),
      paypal_subscription_id = NULL,
      paypal_payer_id = NULL;
END $$;
```

## Existing PayPal subscriptions

The webhook validates PayPal signatures and checks that subscription events belong to
one of the configured VIP plans before updating membership status. Cancellation is
available from the VIP page. Keep the optional legacy plan ID and webhook configured
until subscriptions created on the old plan have been cancelled or expired.

Keep `SUPABASE_SERVICE_ROLE_KEY` and PayPal secrets server-side. Do not prefix them
with `NEXT_PUBLIC_`.
