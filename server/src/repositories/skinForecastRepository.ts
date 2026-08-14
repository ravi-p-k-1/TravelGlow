import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import type { SkinConcernForecast } from "../domain/skin-engine/types.js";
import type { ForecastExplanation, SkinForecast } from "../models/skinForecast.js";

interface ForecastRow {
  id: string; trip_id: string; skin_analysis_id: string;
  environment_comparison_id: string; concerns: SkinConcernForecast[];
  engine_version: string; explanation: ForecastExplanation | null;
  explanation_model: string | null; explained_at: Date | null;
  created_at: Date; updated_at: Date;
}
const columns = `id, trip_id, skin_analysis_id, environment_comparison_id,
  concerns, engine_version, explanation, explanation_model, explained_at,
  created_at, updated_at`;

function mapRow(row: ForecastRow): SkinForecast {
  return { id: row.id, tripId: row.trip_id, skinAnalysisId: row.skin_analysis_id,
    environmentComparisonId: row.environment_comparison_id, concerns: row.concerns,
    engineVersion: row.engine_version, explanation: row.explanation ?? undefined,
    explanationModel: row.explanation_model ?? undefined,
    explainedAt: row.explained_at?.toISOString(), createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString() };
}

export async function saveForecastExplanation(
  tripId: string,
  explanation: ForecastExplanation,
  model: string,
): Promise<SkinForecast> {
  const result = await database.query<ForecastRow>(
    `UPDATE skin_forecasts SET explanation=$2::jsonb, explanation_model=$3,
      explained_at=NOW(), updated_at=NOW()
    WHERE trip_id=$1 RETURNING ${columns}`,
    [tripId, JSON.stringify(explanation), model],
  );
  return mapRow(result.rows[0]!);
}

export async function findSkinForecast(tripId: string): Promise<SkinForecast | null> {
  const result = await database.query<ForecastRow>(`SELECT ${columns} FROM skin_forecasts WHERE trip_id=$1`, [tripId]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function saveSkinForecast(
  tripId: string, skinAnalysisId: string, environmentComparisonId: string,
  concerns: SkinConcernForecast[], engineVersion: string,
): Promise<SkinForecast> {
  const result = await database.query<ForecastRow>(
    `INSERT INTO skin_forecasts (id, trip_id, skin_analysis_id,
      environment_comparison_id, concerns, engine_version)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6)
    ON CONFLICT (trip_id) DO UPDATE SET skin_analysis_id=EXCLUDED.skin_analysis_id,
      environment_comparison_id=EXCLUDED.environment_comparison_id,
      concerns=EXCLUDED.concerns, engine_version=EXCLUDED.engine_version, updated_at=NOW()
    RETURNING ${columns}`,
    [randomUUID(), tripId, skinAnalysisId, environmentComparisonId,
      JSON.stringify(concerns), engineVersion],
  );
  return mapRow(result.rows[0]!);
}

export async function deleteSkinForecast(tripId: string): Promise<void> {
  await database.query("DELETE FROM skin_forecasts WHERE trip_id=$1", [tripId]);
}
