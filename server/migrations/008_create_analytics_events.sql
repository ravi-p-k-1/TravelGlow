CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  product_id VARCHAR(80) REFERENCES products(id) ON DELETE SET NULL,
  retailer VARCHAR(120),
  partner BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analytics_events_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT analytics_events_type_allowed CHECK (event_type IN (
    'trip_created', 'skin_scan_started', 'skin_scan_completed',
    'skin_forecast_generated', 'product_recommendation_viewed',
    'product_clicked', 'purchase_link_clicked',
    'partner_product_clicked', 'partner_purchase_link_clicked'
  ))
);

CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_product_idx ON analytics_events (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_trip_idx ON analytics_events (trip_id, created_at DESC);
