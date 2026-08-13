import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import type { NewSkinAnalysis, SkinAnalysis } from "../models/skinAnalysis.js";

interface SkinAnalysisRow {
  id: string; trip_id: string; oiliness: number | null; hydration: number | null;
  acne: number | null; redness: number | null; pores: number | null; spots: number | null;
  texture: number | null; dark_circles: number | null; wrinkles: number | null;
  firmness: number | null; radiance: number | null; overall_score: number | null;
  skin_age: number | null; provider: string; external_task_id: string | null;
  created_at: Date; updated_at: Date;
}

const columns = `id, trip_id, oiliness, hydration, acne, redness, pores, spots,
  texture, dark_circles, wrinkles, firmness, radiance, overall_score, skin_age,
  provider, external_task_id, created_at, updated_at`;

function optional<T>(value: T | null): T | undefined { return value ?? undefined; }

function mapRow(row: SkinAnalysisRow): SkinAnalysis {
  return {
    id: row.id, tripId: row.trip_id, oiliness: optional(row.oiliness),
    hydration: optional(row.hydration), acne: optional(row.acne),
    redness: optional(row.redness), pores: optional(row.pores), spots: optional(row.spots),
    texture: optional(row.texture), darkCircles: optional(row.dark_circles),
    wrinkles: optional(row.wrinkles), firmness: optional(row.firmness),
    radiance: optional(row.radiance), overallScore: optional(row.overall_score),
    skinAge: optional(row.skin_age), provider: row.provider,
    externalTaskId: optional(row.external_task_id), createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findSkinAnalysis(tripId: string): Promise<SkinAnalysis | null> {
  const result = await database.query<SkinAnalysisRow>(
    `SELECT ${columns} FROM skin_analyses WHERE trip_id=$1`, [tripId],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function saveSkinAnalysis(
  tripId: string,
  analysis: NewSkinAnalysis,
): Promise<SkinAnalysis> {
  const result = await database.query<SkinAnalysisRow>(
    `INSERT INTO skin_analyses (id, trip_id, oiliness, hydration, acne, redness,
      pores, spots, texture, dark_circles, wrinkles, firmness, radiance,
      overall_score, skin_age, provider, external_task_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (trip_id) DO UPDATE SET
      oiliness=EXCLUDED.oiliness, hydration=EXCLUDED.hydration, acne=EXCLUDED.acne,
      redness=EXCLUDED.redness, pores=EXCLUDED.pores, spots=EXCLUDED.spots,
      texture=EXCLUDED.texture, dark_circles=EXCLUDED.dark_circles,
      wrinkles=EXCLUDED.wrinkles, firmness=EXCLUDED.firmness,
      radiance=EXCLUDED.radiance, overall_score=EXCLUDED.overall_score,
      skin_age=EXCLUDED.skin_age, provider=EXCLUDED.provider,
      external_task_id=EXCLUDED.external_task_id, updated_at=NOW()
    RETURNING ${columns}`,
    [randomUUID(), tripId, analysis.oiliness ?? null, analysis.hydration ?? null,
      analysis.acne ?? null, analysis.redness ?? null, analysis.pores ?? null,
      analysis.spots ?? null, analysis.texture ?? null, analysis.darkCircles ?? null,
      analysis.wrinkles ?? null, analysis.firmness ?? null, analysis.radiance ?? null,
      analysis.overallScore ?? null, analysis.skinAge ?? null, analysis.provider,
      analysis.externalTaskId ?? null],
  );
  return mapRow(result.rows[0]!);
}
