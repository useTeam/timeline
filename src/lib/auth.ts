export type Role = "public" | "admin";

export type Session = {
  username: string;
  role: Role;
};

const STORAGE_KEY = "timeline.session";
const SESSION_EVENT = "timeline:session";

const USERS: Array<{ username: string; password: string; role: Role }> = [
  { username: "dev.public", password: "dev.public2026", role: "public" },
  { username: "jon.pereyra", password: "jon2026", role: "admin" },
];

export function loadSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.username !== "string" ||
      (parsed.role !== "public" && parsed.role !== "admin")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function authenticate(username: string, password: string): Session {
  const u = USERS.find((x) => x.username === username);
  if (!u || u.password !== password) {
    throw new Error("Usuario o contraseña inválidos");
  }
  return { username: u.username, role: u.role };
}

