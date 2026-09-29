ALTER TABLE public.bio_profiles
  ADD COLUMN IF NOT EXISTS ads_enabled boolean NOT NULL DEFAULT true;