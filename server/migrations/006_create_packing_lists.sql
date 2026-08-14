CREATE TABLE IF NOT EXISTS packing_lists (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  forecast_id UUID NOT NULL UNIQUE REFERENCES skin_forecasts(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  generator_version VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT packing_lists_items_array CHECK (jsonb_typeof(items) = 'array')
);

CREATE INDEX IF NOT EXISTS packing_lists_trip_id_idx ON packing_lists (trip_id);
