ALTER TABLE skin_forecasts
  ADD COLUMN IF NOT EXISTS explanation JSONB,
  ADD COLUMN IF NOT EXISTS explanation_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS explained_at TIMESTAMPTZ;

ALTER TABLE skin_forecasts
  DROP CONSTRAINT IF EXISTS skin_forecasts_explanation_object;

ALTER TABLE skin_forecasts
  ADD CONSTRAINT skin_forecasts_explanation_object CHECK (
    explanation IS NULL OR jsonb_typeof(explanation) = 'object'
  );
