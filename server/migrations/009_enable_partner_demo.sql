-- Simulated hackathon placement only. This does not represent a real partnership.
UPDATE products
SET partner=TRUE, partner_priority=2, updated_at=NOW()
WHERE id='lrp-uvair-spf50';

UPDATE product_purchase_links
SET partner=TRUE
WHERE product_id='lrp-uvair-spf50' AND retailer='La Roche-Posay';

-- Catalog merchandising changed, so regenerate derived rankings on next visit.
DELETE FROM product_recommendations;
