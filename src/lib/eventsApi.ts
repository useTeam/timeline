import type { TimelineEvent } from "../types";

const SEED_URL = "/seed.json";

type SeedFile = { events: TimelineEvent[] };

let events: TimelineEvent[] | null = null;

function sortByDate(list: TimelineEvent[]): TimelineEvent[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}

async function load(): Promise<TimelineEvent[]> {
  if (events) return events;

  const res = await fetch(SEED_URL);
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${SEED_URL} (${res.status})`);
  }

  const data = (await res.json()) as SeedFile;
  events = sortByDate(data.events);
  return events;
}

function newId(): string {
  return Math.random().toString(16).slice(2, 6);
}

export async function listEvents(): Promise<TimelineEvent[]> {
  return load();
}

export async function createEvent(
  input: Omit<TimelineEvent, "id">,
): Promise<TimelineEvent> {
  const list = await load();
  const created: TimelineEvent = { ...input, id: newId() };
  events = sortByDate([...list, created]);
  return created;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<TimelineEvent, "id">>,
): Promise<TimelineEvent> {
  const list = await load();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Evento no encontrado");
  const updated = { ...list[idx], ...patch, id };
  list[idx] = updated;
  events = sortByDate(list);
  return updated;
}

export async function deleteEvent(id: string): Promise<void> {
  const list = await load();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) throw new Error("Evento no encontrado");
  events = sortByDate(next);
}
