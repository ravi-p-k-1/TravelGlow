import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import type {
  EnvironmentComparison,
  EnvironmentData,
  EnvironmentSnapshotType,
  NewEnvironmentData,
  TripEnvironment,
} from "../models/environment.js";
import type { EnvironmentDifferences } from "../domain/environmentComparison.js";

interface SnapshotRow {
  id: string; trip_id: string; snapshot_type: EnvironmentSnapshotType;
  location: string; latitude: number | null; longitude: number | null;
  temperature_f: number | null; humidity: number | null; uv_index: number | null;
  precipitation_chance: number | null; precipitation_mm: number | null;
  condition: string | null; provider: string; fetched_at: Date; created_at: Date;
}

interface ComparisonRow {
  id: string; trip_id: string; temperature_change_f: number | null;
  humidity_change: number | null; uv_change: number | null;
  precipitation_change: number | null; created_at: Date; updated_at: Date;
}

function optionalNumber(value: number | null): number | undefined {
  return value ?? undefined;
}

function mapSnapshot(row: SnapshotRow): EnvironmentData {
  return {
    id: row.id, tripId: row.trip_id, snapshotType: row.snapshot_type,
    location: row.location, latitude: optionalNumber(row.latitude),
    longitude: optionalNumber(row.longitude), temperatureF: optionalNumber(row.temperature_f),
    humidity: optionalNumber(row.humidity), uvIndex: optionalNumber(row.uv_index),
    precipitationChance: optionalNumber(row.precipitation_chance),
    precipitationMm: optionalNumber(row.precipitation_mm),
    condition: row.condition ?? undefined, provider: row.provider,
    fetchedAt: row.fetched_at.toISOString(), createdAt: row.created_at.toISOString(),
  };
}

function mapComparison(row: ComparisonRow): EnvironmentComparison {
  return {
    id: row.id, tripId: row.trip_id,
    temperatureChangeF: optionalNumber(row.temperature_change_f),
    humidityChange: optionalNumber(row.humidity_change), uvChange: optionalNumber(row.uv_change),
    precipitationChange: optionalNumber(row.precipitation_change),
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  };
}

const snapshotColumns = `id, trip_id, snapshot_type, location, latitude, longitude,
  temperature_f, humidity, uv_index, precipitation_chance, precipitation_mm,
  condition, provider, fetched_at, created_at`;
const comparisonColumns = `id, trip_id, temperature_change_f, humidity_change,
  uv_change, precipitation_change, created_at, updated_at`;

export async function saveTripEnvironment(
  tripId: string,
  current: NewEnvironmentData,
  destination: NewEnvironmentData,
  differences: EnvironmentDifferences,
): Promise<TripEnvironment> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const saved: EnvironmentData[] = [];
    for (const [type, data] of [["current", current], ["destination", destination]] as const) {
      const result = await client.query<SnapshotRow>(
        `INSERT INTO environment_snapshots (id, trip_id, snapshot_type, location,
          latitude, longitude, temperature_f, humidity, uv_index,
          precipitation_chance, precipitation_mm, condition, provider, fetched_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (trip_id, snapshot_type) DO UPDATE SET
          location=EXCLUDED.location, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
          temperature_f=EXCLUDED.temperature_f, humidity=EXCLUDED.humidity,
          uv_index=EXCLUDED.uv_index, precipitation_chance=EXCLUDED.precipitation_chance,
          precipitation_mm=EXCLUDED.precipitation_mm, condition=EXCLUDED.condition,
          provider=EXCLUDED.provider, fetched_at=EXCLUDED.fetched_at
        RETURNING ${snapshotColumns}`,
        [randomUUID(), tripId, type, data.location, data.latitude ?? null,
          data.longitude ?? null, data.temperatureF ?? null, data.humidity ?? null,
          data.uvIndex ?? null, data.precipitationChance ?? null,
          data.precipitationMm ?? null, data.condition ?? null, data.provider, data.fetchedAt],
      );
      saved.push(mapSnapshot(result.rows[0]!));
    }
    const comparisonResult = await client.query<ComparisonRow>(
      `INSERT INTO environment_comparisons (id, trip_id, temperature_change_f,
        humidity_change, uv_change, precipitation_change)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (trip_id) DO UPDATE SET
        temperature_change_f=EXCLUDED.temperature_change_f,
        humidity_change=EXCLUDED.humidity_change, uv_change=EXCLUDED.uv_change,
        precipitation_change=EXCLUDED.precipitation_change, updated_at=NOW()
      RETURNING ${comparisonColumns}`,
      [randomUUID(), tripId, differences.temperatureChangeF ?? null,
        differences.humidityChange ?? null, differences.uvChange ?? null,
        differences.precipitationChange ?? null],
    );
    await client.query("COMMIT");
    return { current: saved[0]!, destination: saved[1]!, comparison: mapComparison(comparisonResult.rows[0]!) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function findTripEnvironment(tripId: string): Promise<TripEnvironment | null> {
  const [snapshots, comparisons] = await Promise.all([
    database.query<SnapshotRow>(`SELECT ${snapshotColumns} FROM environment_snapshots WHERE trip_id=$1`, [tripId]),
    database.query<ComparisonRow>(`SELECT ${comparisonColumns} FROM environment_comparisons WHERE trip_id=$1`, [tripId]),
  ]);
  const current = snapshots.rows.find((row) => row.snapshot_type === "current");
  const destination = snapshots.rows.find((row) => row.snapshot_type === "destination");
  const comparison = comparisons.rows[0];
  if (!current || !destination || !comparison) return null;
  return { current: mapSnapshot(current), destination: mapSnapshot(destination), comparison: mapComparison(comparison) };
}

export async function deleteTripEnvironment(tripId: string): Promise<void> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM environment_comparisons WHERE trip_id=$1", [tripId]);
    await client.query("DELETE FROM environment_snapshots WHERE trip_id=$1", [tripId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
