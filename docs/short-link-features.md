# Short-link features

The short-link security, campaign, analytics, and custom-domain features require the database migration `supabase/migrations/20261102_add_short_link_features.sql`. Apply it to the Supabase project before deploying the application changes.

The application uses `SUPABASE_SERVICE_ROLE_KEY` for server-side link creation, password verification, click recording, and custom-domain verification. Keep this key server-only; never expose it with a `NEXT_PUBLIC_` prefix.

## Link options

Authenticated users can set a password, an expiration date, UTM source/medium/campaign/content/term values, and an optional verified custom domain when creating a short link. Password hashes are stored separately from public link records. Password attempts are limited per link and client IP hash.

Expired links return an expired-link screen. UTM values are appended to the destination URL and recorded with each short-link click. Short-link analytics reports daily clicks, campaign labels, and referring hosts for the last 30 days.

## Custom domains

Add the domain to the urlyu.com Vercel project first and configure the DNS records shown in Vercel. Then add the domain in **Dashboard → Domains**, create a TXT record named `_urlyu-verification.<your-domain>` with the displayed value, and verify it after DNS propagation. Verified domains become selectable for newly created short links.

Removing a domain detaches it from existing links; those links then use the main site domain.
