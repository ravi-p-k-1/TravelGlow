import { z } from "zod";
import { env } from "../config/env.js";
import type { EnvironmentComparison, EnvironmentData } from "../models/environment.js";
import type { SkinAnalysis } from "../models/skinAnalysis.js";
import type { ForecastExplanation } from "../models/skinForecast.js";
import type { SkinConcernForecast } from "../domain/skin-engine/types.js";

const explanationSchema = z.object({
  headline: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(600),
  concerns: z.array(z.object({
    concernId: z.string().trim().min(1),
    explanation: z.string().trim().min(1).max(400),
  })).max(10),
  travelTips: z.array(z.string().trim().min(1).max(180)).max(10),
}).strict();

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

export interface ExplanationInput {
  skinAnalysis: SkinAnalysis;
  destinationEnvironment: EnvironmentData;
  comparison: EnvironmentComparison;
  concerns: SkinConcernForecast[];
}

export function validateGroundedExplanation(
  candidate: unknown,
  concerns: SkinConcernForecast[],
): ForecastExplanation {
  const explanation = explanationSchema.parse(candidate);
  const expectedIds = new Set<string>(concerns.map((concern) => concern.id));
  const receivedIds = explanation.concerns.map((concern) => concern.concernId);
  if (
    receivedIds.length !== expectedIds.size ||
    new Set(receivedIds).size !== receivedIds.length ||
    receivedIds.some((id) => !expectedIds.has(id))
  ) {
    throw new Error("Gemini explanation concerns did not match the deterministic forecast");
  }

  const allowedTips = new Set(concerns.flatMap((concern) => concern.recommendations));
  if (explanation.travelTips.some((tip) => !allowedTips.has(tip))) {
    throw new Error("Gemini explanation introduced an unsupported travel tip");
  }
  return explanation;
}

function responseSchema(concerns: SkinConcernForecast[]) {
  const concernIds = concerns.map((concern) => concern.id);
  const recommendations = [...new Set(concerns.flatMap((concern) => concern.recommendations))];
  return {
    type: "OBJECT",
    required: ["headline", "summary", "concerns", "travelTips"],
    properties: {
      headline: { type: "STRING", description: "A concise travel skincare headline under 100 characters." },
      summary: { type: "STRING", description: "A concise, cautious explanation of only the supplied facts." },
      concerns: {
        type: "ARRAY",
        minItems: concerns.length,
        maxItems: concerns.length,
        items: {
          type: "OBJECT",
          required: ["concernId", "explanation"],
          properties: {
            concernId: concernIds.length > 0
              ? { type: "STRING", enum: concernIds }
              : { type: "STRING" },
            explanation: { type: "STRING", description: "Accessible possibility-based explanation using only supplied factors." },
          },
        },
      },
      travelTips: {
        type: "ARRAY",
        maxItems: recommendations.length,
        items: recommendations.length > 0
          ? { type: "STRING", enum: recommendations }
          : { type: "STRING" },
      },
    },
  };
}

function prompt(input: ExplanationInput): string {
  return `You are the explanation layer for TravelGlow, a non-medical travel skincare planner.

Explain only the structured findings in the JSON below.
- Use accessible, friendly, concise language.
- Use cautious terms such as may, could, potentially, and consider.
- Do not diagnose, claim certainty, mention diseases, or recommend prescriptions.
- Do not invent concerns, scores, environmental facts, effects, or recommendations.
- Include exactly one explanation for every concernId provided.
- travelTips must be copied verbatim from the provided recommendations.

FACTS:
${JSON.stringify({
    skin: {
      oiliness: input.skinAnalysis.oiliness,
      hydration: input.skinAnalysis.hydration,
      acne: input.skinAnalysis.acne,
      redness: input.skinAnalysis.redness,
      pores: input.skinAnalysis.pores,
      texture: input.skinAnalysis.texture,
      radiance: input.skinAnalysis.radiance,
    },
    environment: {
      destinationTemperatureF: input.destinationEnvironment.temperatureF,
      destinationHumidity: input.destinationEnvironment.humidity,
      destinationUvIndex: input.destinationEnvironment.uvIndex,
      temperatureChangeF: input.comparison.temperatureChangeF,
      humidityChange: input.comparison.humidityChange,
      uvChange: input.comparison.uvChange,
    },
    forecast: input.concerns,
  })}`;
}

export async function generateForecastExplanation(
  input: ExplanationInput,
): Promise<ForecastExplanation> {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not configured");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt(input) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema(input.concerns),
          maxOutputTokens: 1400,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Gemini returned an error", response.status, errorText.slice(0, 500));
    throw new Error("Gemini explanation request failed");
  }
  const body = (await response.json()) as GeminiResponse;
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) {
    console.error("Gemini returned no explanation", body.promptFeedback?.blockReason);
    throw new Error("Gemini returned no explanation");
  }
  return validateGroundedExplanation(JSON.parse(text), input.concerns);
}
