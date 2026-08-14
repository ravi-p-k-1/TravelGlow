CREATE TABLE IF NOT EXISTS skin_forecasts (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  skin_analysis_id UUID NOT NULL REFERENCES skin_analyses(id) ON DELETE CASCADE,
  environment_comparison_id UUID NOT NULL REFERENCES environment_comparisons(id) ON DELETE CASCADE,
  concerns JSONB NOT NULL,
  engine_version VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT skin_forecasts_concerns_array CHECK (jsonb_typeof(concerns) = 'array')
);

CREATE INDEX IF NOT EXISTS skin_forecasts_trip_id_idx ON skin_forecasts (trip_id);
