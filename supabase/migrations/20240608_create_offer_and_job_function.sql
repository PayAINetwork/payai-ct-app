-- Migration: create_offer_and_job function

CREATE OR REPLACE FUNCTION public.create_offer_and_job(
  p_seller_id   UUID,
  p_buyer_id    UUID,
  p_amount      NUMERIC,
  p_currency    TEXT,
  p_description TEXT,
  p_created_by  UUID
)
RETURNS TABLE (offer_id UUID, job_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1) Insert into offers
  INSERT INTO offers (
    seller_id, buyer_id, amount, currency,
    description, status, created_by,
    created_at, updated_at
  )
  VALUES (
    p_seller_id, p_buyer_id, p_amount, p_currency,
    p_description, 'created', p_created_by,
    now(), now()
  )
  RETURNING id INTO offer_id;  -- capture new offer ID

  -- 2) Insert into jobs, referencing that offer
  INSERT INTO jobs (
    offer_id, seller_id, buyer_id,
    status, created_at, updated_at
  )
  VALUES (
    offer_id, p_seller_id, p_buyer_id,
    'created', now(), now()
  )
  RETURNING id INTO job_id;    -- capture new job ID

  -- 3) Return both IDs as a single row
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_offer_and_job(
  UUID, UUID, NUMERIC, TEXT, TEXT, UUID
) TO authenticated; 