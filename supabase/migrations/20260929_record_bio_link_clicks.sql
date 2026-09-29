CREATE OR REPLACE FUNCTION public.record_bio_link_click(p_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clicked_bio_id uuid;
BEGIN
  UPDATE public.bio_links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = p_link_id
    AND is_active = true
  RETURNING bio_id INTO clicked_bio_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO public.bio_link_analytics (bio_id, created_at)
  VALUES (clicked_bio_id, now());
END;
$$;

REVOKE ALL ON FUNCTION public.record_bio_link_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_bio_link_click(uuid) TO anon, authenticated;