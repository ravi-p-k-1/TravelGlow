CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY,
  current_location VARCHAR(200) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trips_location_not_blank CHECK (
    LENGTH(TRIM(current_location)) > 0 AND LENGTH(TRIM(destination)) > 0
  ),
  CONSTRAINT trips_date_order CHECK (return_date >= departure_date)
);

CREATE INDEX IF NOT EXISTS trips_created_at_idx ON trips (created_at DESC);
