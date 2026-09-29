ALTER TABLE public.bio_links
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ordered_links AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY bio_id
      ORDER BY created_at ASC, id ASC
    ) - 1 AS sort_order
  FROM public.bio_links
)
UPDATE public.bio_links AS bio_link
SET sort_order = ordered_links.sort_order
FROM ordered_links
WHERE bio_link.id = ordered_links.id;

CREATE INDEX IF NOT EXISTS bio_links_bio_id_sort_order_idx
  ON public.bio_links (bio_id, sort_order);