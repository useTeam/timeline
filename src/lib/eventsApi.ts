import type { TimelineEvent } from "../types";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

async function check(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res;
}

export async function listEvents(): Promise<TimelineEvent[]> {
  const res = await check(await fetch(`${BASE_URL}/events?_sort=date&_order=asc`));
  return (await res.json()) as TimelineEvent[];
}

export async function createEvent(
  input: Omit<TimelineEvent, "id">,
): Promise<TimelineEvent> {
  const res = await check(
    await fetch(`${BASE_URL}/events`, {
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
    await fetch(`${BASE_URL}/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  return (await res.json()) as TimelineEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  await check(await fetch(`${BASE_URL}/events/${id}`, { method: "DELETE" }));
}

