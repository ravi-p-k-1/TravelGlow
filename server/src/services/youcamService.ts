import { setTimeout as delay } from "node:timers/promises";
import { env } from "../config/env.js";
import type { NewSkinAnalysis, SelfieUpload } from "../models/skinAnalysis.js";
import { ApiError } from "../utils/apiError.js";

const API_BASE_URL = "https://yce-api-01.makeupar.com/s2s/v2.1";
const SD_ACTIONS = [
  "wrinkle", "pore", "texture", "acne", "oiliness", "radiance", "age_spot",
  "dark_circle_v2", "redness", "moisture", "firmness",
] as const;

interface UploadFileData {
  file_id: string;
  requests: Array<{ method: string; url: string; headers?: Record<string, string> }>;
}

interface TaskOutput {
  type: string;
  ui_score?: number;
  raw_score?: number;
}

interface YoucamResponse {
  status?: number;
  data?: {
    files?: UploadFileData[];
    task_id?: string;
    task_status?: "running" | "success" | "error";
    results?: { output?: TaskOutput[] };
    error?: string;
  };
  files?: UploadFileData[];
  error?: string;
}

function authorizationHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${env.youcamApiKey}` };
}

async function jsonRequest(url: string, init: RequestInit): Promise<YoucamResponse> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    console.error("YouCam request failed", error);
    throw new ApiError(502, "Skin analysis is temporarily unavailable");
  }
  const body = (await response.json().catch(() => ({}))) as YoucamResponse;
  if (!response.ok) {
    console.error("YouCam returned an error", response.status, body.error ?? body.data?.error);
    throw new ApiError(502, "Skin analysis is temporarily unavailable");
  }
  return body;
}

async function uploadSelfie(image: SelfieUpload): Promise<string> {
  const metadata = await jsonRequest(`${API_BASE_URL}/file/skin-analysis`, {
    method: "POST",
    headers: { ...authorizationHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ content_type: image.contentType,
      file_name: image.fileName, file_size: image.size }] }),
  });
  const file = metadata.data?.files?.[0] ?? metadata.files?.[0];
  const uploadRequest = file?.requests?.[0];
  if (!file?.file_id || !uploadRequest?.url) {
    throw new ApiError(502, "Skin analysis is temporarily unavailable");
  }
  const uploadResponse = await fetch(uploadRequest.url, {
    method: uploadRequest.method || "PUT",
    headers: uploadRequest.headers,
    body: new Uint8Array(image.buffer),
    signal: AbortSignal.timeout(30_000),
  }).catch((error: unknown) => {
    console.error("YouCam presigned upload failed", error);
    throw new ApiError(502, "Skin analysis is temporarily unavailable");
  });
  if (!uploadResponse.ok) throw new ApiError(502, "Skin analysis is temporarily unavailable");
  return file.file_id;
}

function scoreMap(outputs: TaskOutput[]): Map<string, number> {
  return new Map(outputs.flatMap((output) =>
    output.ui_score === undefined ? [] : [[output.type.replace(/^hd_/, ""), output.ui_score] as const],
  ));
}

function normalizeResults(outputs: TaskOutput[], taskId: string): NewSkinAnalysis {
  const scores = scoreMap(outputs);
  return {
    oiliness: scores.get("oiliness"), hydration: scores.get("moisture"),
    acne: scores.get("acne"), redness: scores.get("redness"), pores: scores.get("pore"),
    spots: scores.get("age_spot"), texture: scores.get("texture"),
    darkCircles: scores.get("dark_circle_v2") ?? scores.get("dark_circle"),
    wrinkles: scores.get("wrinkle"), firmness: scores.get("firmness"),
    radiance: scores.get("radiance"), provider: "youcam", externalTaskId: taskId,
  };
}

async function runLiveAnalysis(image: SelfieUpload): Promise<NewSkinAnalysis> {
  if (!env.youcamApiKey) {
    throw new ApiError(503, "YouCam is not configured. Enable mock mode or add YOUCAM_API_KEY.");
  }
  const fileId = await uploadSelfie(image);
  const task = await jsonRequest(`${API_BASE_URL}/task/skin-analysis`, {
    method: "POST",
    headers: { ...authorizationHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ src_file_id: fileId, dst_actions: SD_ACTIONS, format: "json",
      miniserver_args: { enable_mask_overlay: false }, pf_camera_kit: false }),
  });
  const taskId = task.data?.task_id;
  if (!taskId) throw new ApiError(502, "Skin analysis is temporarily unavailable");

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (attempt > 0) await delay(2_000);
    const status = await jsonRequest(`${API_BASE_URL}/task/skin-analysis/${encodeURIComponent(taskId)}`, {
      method: "GET", headers: authorizationHeaders(),
    });
    if (status.data?.task_status === "error") {
      throw new ApiError(422, "The selfie could not be analyzed. Try a clear, front-facing photo.");
    }
    if (status.data?.task_status === "success") {
      return normalizeResults(status.data.results?.output ?? [], taskId);
    }
  }
  throw new ApiError(504, "Skin analysis is taking longer than expected. Please try again.");
}

function mockAnalysis(): NewSkinAnalysis {
  return {
    oiliness: 78, hydration: 47, acne: 52, redness: 24, pores: 65,
    spots: 31, texture: 58, darkCircles: 42, wrinkles: 29, firmness: 71,
    radiance: 68, overallScore: 67, skinAge: 32, provider: "mock",
  };
}

export async function analyzeSelfie(image: SelfieUpload): Promise<NewSkinAnalysis> {
  return env.useMockYoucam ? mockAnalysis() : runLiveAnalysis(image);
}
