import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../assets/brand-mark.svg";
import { authenticate, saveSession } from "../lib/auth";

type LocationState = { from?: string } | null;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const session = authenticate(username.trim(), password);
      saveSession(session);
      navigate(state?.from ?? "/timeline", { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo iniciar sesión");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-start gap-4">
            <img src={BrandMark} alt="" className="h-11 w-11" />
            <div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight">
                Timeline 2026
              </h1>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                Iniciá sesión para acceder.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-amber-500/10 p-5 dark:border-zinc-800 dark:bg-none">
              <div className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Autenticación
              </div>
              <div className="mt-1 text-lg font-semibold">Iniciar sesión</div>
            </div>

            <form className="p-5" onSubmit={(e) => void handleSubmit(e)}>
              {err ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {err}
                </div>
              ) : null}

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-600 dark:text-zinc-300">
                    Usuario
                  </label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100 dark:focus:border-zinc-700"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    spellCheck={false}
                    disabled={submitting}
                    placeholder="dev.public o jon.pereyra"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs text-zinc-600 dark:text-zinc-300">
                    Contraseña
                  </label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100 dark:focus:border-zinc-700"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={submitting}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  className="mt-1 rounded-xl bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Ingresando…" : "Ingresar"}
                </button>

                <div className="mt-1 rounded-xl border border-zinc-200 bg-white/60 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-300">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    Usuarios disponibles
                  </div>
                  <div className="mt-2 grid gap-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span>dev.public</span>
                      <span className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
                        Público (solo lectura)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>jon.pereyra</span>
                      <span className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
                        Admin (CRUD completo)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

