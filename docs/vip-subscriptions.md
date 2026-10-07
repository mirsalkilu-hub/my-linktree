# VIP subscriptions

VIP membership costs **$20 USD per year** and automatically renews annually through Stripe or PayPal.
VIP users can disable ads on their bio pages; free users cannot.

## Setup

1. Apply `supabase/migrations/20261008_add_vip_subscriptions.sql` and
   `supabase/migrations/20261009_add_paypal_vip.sql` to the Supabase project.
2. Set the variables listed in `.env.example` in the deployment environment.
3. In Stripe, enable the customer portal so members can manage or cancel automatic renewal.
4. Add a Stripe webhook endpoint at `https://<your-domain>/api/vip/webhook` for
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`.
5. Set the Stripe webhook's signing secret as `STRIPE_WEBHOOK_SECRET`.
6. In PayPal, create a yearly $20 USD subscription plan and configure `PAYPAL_MODE`,
   `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_VIP_PLAN_ID`.
7. Add a PayPal webhook endpoint at `https://<your-domain>/api/vip/paypal/webhook` for
   `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`,
   `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.CANCELLED`, and
   `BILLING.SUBSCRIPTION.EXPIRED`. Set its webhook ID as `PAYPAL_WEBHOOK_ID`.

Use PayPal sandbox credentials and a sandbox plan while testing; switch `PAYPAL_MODE` to `live`
only when the live PayPal app and plan are configured. Keep `SUPABASE_SERVICE_ROLE_KEY`, Stripe
keys, and PayPal secrets server-side. Do not prefix them with `NEXT_PUBLIC_`.
