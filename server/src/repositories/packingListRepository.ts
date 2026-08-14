import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import type { PackingItem, PackingList } from "../models/packingList.js";

interface PackingListRow {
  id: string;
  trip_id: string;
  forecast_id: string;
  items: PackingItem[];
  generator_version: string;
  created_at: Date;
  updated_at: Date;
}

const columns = "id, trip_id, forecast_id, items, generator_version, created_at, updated_at";

function mapRow(row: PackingListRow): PackingList {
  return {
    id: row.id,
    tripId: row.trip_id,
    forecastId: row.forecast_id,
    items: row.items,
    generatorVersion: row.generator_version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findPackingList(tripId: string): Promise<PackingList | null> {
  const result = await database.query<PackingListRow>(
    `SELECT ${columns} FROM packing_lists WHERE trip_id=$1`,
    [tripId],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function savePackingList(
  tripId: string,
  forecastId: string,
  items: PackingItem[],
  generatorVersion: string,
): Promise<PackingList> {
  const result = await database.query<PackingListRow>(
    `INSERT INTO packing_lists (id, trip_id, forecast_id, items, generator_version)
     VALUES ($1,$2,$3,$4::jsonb,$5)
     ON CONFLICT (trip_id) DO UPDATE SET forecast_id=EXCLUDED.forecast_id,
       items=EXCLUDED.items, generator_version=EXCLUDED.generator_version, updated_at=NOW()
     RETURNING ${columns}`,
    [randomUUID(), tripId, forecastId, JSON.stringify(items), generatorVersion],
  );
  return mapRow(result.rows[0]!);
}
