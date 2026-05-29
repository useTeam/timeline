import type { TimelineEvent } from "../types";

function apiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3001";
  }
  // Producción: mismo origen → proxy en vercel.json (no usar VITE_API_URL si apunta al front)
  return "/api";
}

async function check(res: Response, requestedUrl: string) {
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    if (text.trimStart().startsWith("<!")) {
      throw new Error(
        `La URL ${requestedUrl} devolvió HTML en lugar de JSON. ` +
          "Abrí /api/health en el navegador (debe verse JSON). " +
          "En Vercel: Root Directory = raíz del repo, variable MONGODB_URI, push + redeploy.",
      );
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res;
}

export async function listEvents(): Promise<TimelineEvent[]> {
  const url = `${apiBaseUrl()}/events?_sort=date&_order=asc`;
  const res = await check(await fetch(url), url);
  return (await res.json()) as TimelineEvent[];
}

export async function createEvent(
  input: Omit<TimelineEvent, "id">,
): Promise<TimelineEvent> {
  const url = `${apiBaseUrl()}/events`;
  const res = await check(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    url,
  );
  return (await res.json()) as TimelineEvent;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<TimelineEvent, "id">>,
): Promise<TimelineEvent> {
  const url = `${apiBaseUrl()}/events/${id}`;
  const res = await check(
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
    url,
  );
  return (await res.json()) as TimelineEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const url = `${apiBaseUrl()}/events/${id}`;
  await check(await fetch(url, { method: "DELETE" }), url);
}

