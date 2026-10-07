# VIP subscriptions

VIP membership costs **$20 USD per year** and automatically renews annually through Stripe Checkout.
VIP users can disable Adsterra ads on their bio pages; free users cannot.

## Setup

1. Apply `supabase/migrations/20261008_add_vip_subscriptions.sql` to the Supabase project.
2. Set the variables listed in `.env.example` in the deployment environment.
3. In Stripe, enable the customer portal so members can manage or cancel automatic renewal.
4. Add a Stripe webhook endpoint at `https://<your-domain>/api/vip/webhook` for
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`.
5. Set the webhook's signing secret as `STRIPE_WEBHOOK_SECRET`.

Keep `SUPABASE_SERVICE_ROLE_KEY` and all Stripe keys server-side. Do not prefix them with
`NEXT_PUBLIC_`.
