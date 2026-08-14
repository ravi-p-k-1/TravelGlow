import type { AnalyticsEventInput, AnalyticsSummary } from "../types/analytics";

interface AnalyticsResponse { analytics: AnalyticsSummary; }
interface ErrorResponse { error?: string; }

export async function trackAnalyticsEvent(input: AnalyticsEventInput): Promise<void> {
  const response = await fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  });
  if (!response.ok) throw new Error("Analytics event could not be recorded");
}

export async function getAnalyticsSummary(signal?: AbortSignal): Promise<AnalyticsSummary> {
  const response = await fetch("/api/admin/analytics", { signal });
  const body = (await response.json()) as AnalyticsResponse | ErrorResponse;
  if (!response.ok) throw new Error((body as ErrorResponse).error ?? "Analytics could not be retrieved");
  return (body as AnalyticsResponse).analytics;
}
