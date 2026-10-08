# VIP membership

VIP membership costs **Rp100.000 for one year** and is paid manually by bank transfer
or QRIS. It does not renew automatically. Customers contact the operator on WhatsApp
for payment instructions and send their payment receipt in the chat. Activate VIP only
after verifying that the payment was received.

## Setup

1. Apply `supabase/migrations/20261008_add_vip_subscriptions.sql` and
   `supabase/migrations/20261009_add_paypal_vip.sql` to the Supabase project.
2. Set the app and Supabase variables listed in `.env.example` in the deployment
   environment. The `PAYPAL_*` variables are needed only while existing PayPal
   subscriptions still need webhook updates or cancellation.
3. Deploy the app. The VIP page directs customers to WhatsApp at
   `+6285397685933`; send bank transfer or QRIS instructions and ask them to send a
   receipt in the chat.

## Activate a verified manual payment

After confirming the payment and finding the customer's account email, run this in the
Supabase SQL Editor. Replace `customer@example.com` with the email used for their
website account. If the customer has an existing PayPal subscription, cancel it in
PayPal before switching their VIP record to manual payment.

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

The PayPal webhook and cancellation endpoints remain for customers with existing
PayPal subscriptions. Keep their PayPal environment variables and webhook configured
until those subscriptions have been cancelled or expired. New VIP purchases use
manual bank transfer or QRIS and do not use PayPal checkout.

Keep `SUPABASE_SERVICE_ROLE_KEY` and PayPal secrets server-side. Do not prefix them
with `NEXT_PUBLIC_`.
