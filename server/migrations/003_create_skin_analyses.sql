CREATE TABLE IF NOT EXISTS skin_analyses (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  oiliness DOUBLE PRECISION,
  hydration DOUBLE PRECISION,
  acne DOUBLE PRECISION,
  redness DOUBLE PRECISION,
  pores DOUBLE PRECISION,
  spots DOUBLE PRECISION,
  texture DOUBLE PRECISION,
  dark_circles DOUBLE PRECISION,
  wrinkles DOUBLE PRECISION,
  firmness DOUBLE PRECISION,
  radiance DOUBLE PRECISION,
  overall_score DOUBLE PRECISION,
  skin_age INTEGER,
  provider VARCHAR(50) NOT NULL,
  external_task_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT skin_analysis_score_range CHECK (
    (oiliness IS NULL OR oiliness BETWEEN 0 AND 100) AND
    (hydration IS NULL OR hydration BETWEEN 0 AND 100) AND
    (acne IS NULL OR acne BETWEEN 0 AND 100) AND
    (redness IS NULL OR redness BETWEEN 0 AND 100) AND
    (pores IS NULL OR pores BETWEEN 0 AND 100) AND
    (spots IS NULL OR spots BETWEEN 0 AND 100) AND
    (texture IS NULL OR texture BETWEEN 0 AND 100) AND
    (dark_circles IS NULL OR dark_circles BETWEEN 0 AND 100) AND
    (wrinkles IS NULL OR wrinkles BETWEEN 0 AND 100) AND
    (firmness IS NULL OR firmness BETWEEN 0 AND 100) AND
    (radiance IS NULL OR radiance BETWEEN 0 AND 100) AND
    (overall_score IS NULL OR overall_score BETWEEN 0 AND 100)
  )
);

CREATE INDEX IF NOT EXISTS skin_analyses_trip_id_idx ON skin_analyses (trip_id);
