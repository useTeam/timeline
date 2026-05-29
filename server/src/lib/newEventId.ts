export function newEventId(): string {
  return Math.random().toString(16).slice(2, 6);
}
