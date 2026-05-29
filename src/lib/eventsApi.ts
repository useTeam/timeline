import type { TimelineEvent } from "../types";

/** En prod usa /api (proxy en vercel.json). En dev, /api vía vite o localhost directo. */
function apiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return "http://localhost:3001";
  return "/api";
}

async function check(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    if (text.trimStart().startsWith("<!")) {
      throw new Error(
        "La API devolvió HTML en lugar de JSON. Revisá VITE_API_URL en Vercel o usá el proxy /api (redeploy del front).",
      );
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res;
}

export async function listEvents(): Promise<TimelineEvent[]> {
  const res = await check(
    await fetch(`${apiBaseUrl()}/events?_sort=date&_order=asc`),
  );
  return (await res.json()) as TimelineEvent[];
}

export async function createEvent(
  input: Omit<TimelineEvent, "id">,
): Promise<TimelineEvent> {
  const res = await check(
    await fetch(`${apiBaseUrl()}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return (await res.json()) as TimelineEvent;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<TimelineEvent, "id">>,
): Promise<TimelineEvent> {
  const res = await check(
    await fetch(`${apiBaseUrl()}/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  return (await res.json()) as TimelineEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  await check(await fetch(`${apiBaseUrl()}/events/${id}`, { method: "DELETE" }));
}

