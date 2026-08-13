CREATE TABLE IF NOT EXISTS environment_snapshots (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  snapshot_type VARCHAR(20) NOT NULL,
  location VARCHAR(200) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  temperature_f DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  uv_index DOUBLE PRECISION,
  precipitation_chance DOUBLE PRECISION,
  precipitation_mm DOUBLE PRECISION,
  condition VARCHAR(200),
  provider VARCHAR(50) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT environment_snapshot_type CHECK (
    snapshot_type IN ('current', 'destination')
  ),
  CONSTRAINT environment_humidity_range CHECK (
    humidity IS NULL OR humidity BETWEEN 0 AND 100
  ),
  CONSTRAINT environment_precipitation_chance_range CHECK (
    precipitation_chance IS NULL OR precipitation_chance BETWEEN 0 AND 100
  ),
  CONSTRAINT environment_trip_type_unique UNIQUE (trip_id, snapshot_type)
);

CREATE INDEX IF NOT EXISTS environment_snapshots_trip_id_idx
  ON environment_snapshots (trip_id);

CREATE TABLE IF NOT EXISTS environment_comparisons (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  temperature_change_f DOUBLE PRECISION,
  humidity_change DOUBLE PRECISION,
  uv_change DOUBLE PRECISION,
  precipitation_change DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
