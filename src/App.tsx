import { useEffect, useMemo, useState } from "react";
import type { TimelineEvent } from "./types";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from "./lib/eventsApi";
import { clamp } from "./lib/dates";
import { Toaster } from "sonner";
import { clearSession, loadSession, type Session } from "./lib/auth";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { Timeline } from "./ui/Timeline.tsx";
import { EventModal } from "./ui/EventModal.tsx";
import BrandMark from "./assets/brand-mark.svg";
import { LoginPage } from "./ui/LoginPage.tsx";
import { RequireAuth } from "./ui/RequireAuth.tsx";

const START_ISO = "2026-04-10";
const END_ISO = "2026-12-31";

type ModalState =
  | { mode: "closed" }
  | { mode: "create"; seedDateIso: string }
  | { mode: "view"; eventId: number }
  | { mode: "edit"; eventId: number };

export const App = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pxPerDay, setPxPerDay] = useState(18);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const canEdit = session?.role === "admin";

  const selectedEvent = useMemo(() => {
    if (modal.mode === "view" || modal.mode === "edit") {
      return events.find((e) => e.id === modal.eventId) ?? null;
    }
    return null;
  }, [events, modal]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents();
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando eventos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== "timeline.session") return;
      setSession(loadSession());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    function onSession() {
      setSession(loadSession());
    }
    window.addEventListener("timeline:session", onSession);
    return () => window.removeEventListener("timeline:session", onSession);
  }, []);

  function TimelinePage() {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4">
                <img src={BrandMark} alt="" className="h-11 w-11" />
                <div>
                  <h1 className="text-balance text-4xl font-semibold tracking-tight">
                    Timeline 2026
                  </h1>
                  <p className="mt-2 text-base text-zinc-700 dark:text-zinc-300">
                    Rango: <span className="font-mono">{START_ISO}</span> →{" "}
                    <span className="font-mono">{END_ISO}</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-50 dark:hover:bg-zinc-900/60"
                  onClick={() =>
                    setTheme((t) => (t === "dark" ? "light" : "dark"))
                  }
                >
                  {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  onClick={() =>
                    setModal({ mode: "create", seedDateIso: START_ISO })
                  }
                  disabled={!canEdit}
                  title={canEdit ? undefined : "Solo lectura"}
                >
                  Crear evento
                </button>

                {session ? (
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="font-mono text-xs text-zinc-700 dark:text-zinc-200">
                      {session.username}
                    </div>
                    <div
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        canEdit
                          ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {canEdit ? "admin" : "público"}
                    </div>
                    <button
                      className="ml-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/40"
                      onClick={() => {
                        clearSession();
                        setSession(null);
                        setModal({ mode: "closed" });
                        navigate("/login", { replace: true });
                      }}
                    >
                      Salir
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/60 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/30">
                  <div className="text-xs text-zinc-600 dark:text-zinc-300">
                    Zoom
                  </div>
                  <input
                    className="w-40"
                    type="range"
                    min={2}
                    max={18}
                    step={1}
                    value={pxPerDay}
                    onInput={(e) =>
                      setPxPerDay(clamp(Number((e.target as HTMLInputElement).value), 2, 18))
                    }
                    onChange={(e) =>
                      setPxPerDay(clamp(Number(e.target.value), 2, 18))
                    }
                  />
                  <div className="w-16 text-right font-mono text-xs text-zinc-600 dark:text-zinc-300">
                    {pxPerDay}px/d
                  </div>
                </div>
              </div>
            </header>

            <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/20">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                  <div className="mt-3">
                    <button
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 dark:hover:bg-red-950/60"
                      onClick={() => void refresh()}
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : null}

              <Timeline
                startIso={START_ISO}
                endIso={END_ISO}
                events={events}
                pxPerDay={pxPerDay}
                loading={loading}
                canCreate={canEdit}
                onPointClick={(id) => setModal({ mode: "view", eventId: id })}
                onCreateAtDate={(iso) =>
                  setModal({ mode: "create", seedDateIso: iso })
                }
              />
            </section>
          </div>
        </div>

        <EventModal
          startIso={START_ISO}
          endIso={END_ISO}
          state={modal}
          event={selectedEvent}
          canEdit={canEdit}
          onClose={() => {
            if (modal.mode === "edit" && selectedEvent) {
              setModal({ mode: "view", eventId: selectedEvent.id });
              return;
            }
            setModal({ mode: "closed" });
          }}
          onEdit={() => {
            if (!canEdit) return;
            if (selectedEvent)
              setModal({ mode: "edit", eventId: selectedEvent.id });
          }}
          onSaved={async (next) => {
            if (!canEdit) return;
            if (modal.mode === "create") {
              await createEvent(next);
            } else if (modal.mode === "edit" && selectedEvent) {
              const { id: _id, ...patch } = next as unknown as TimelineEvent;
              await updateEvent(selectedEvent.id, patch);
            }
            await refresh();
            setModal({ mode: "closed" });
          }}
          onDelete={async () => {
            if (!canEdit) return;
            if (!selectedEvent) return;
            await deleteEvent(selectedEvent.id);
            await refresh();
            setModal({ mode: "closed" });
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={session ? "/timeline" : "/login"} replace />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/timeline"
          element={
            <RequireAuth>
              <TimelinePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
