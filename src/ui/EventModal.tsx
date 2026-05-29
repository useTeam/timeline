import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EventCardKind, TimelineEvent } from "../types";
import { addDaysIso, clamp, dayOffset } from "../lib/dates";
import { toast } from "sonner";

type ModalState =
  | { mode: "closed" }
  | { mode: "create"; seedDateIso: string }
  | { mode: "view"; eventId: string }
  | { mode: "edit"; eventId: string };

type Props = {
  startIso: string;
  endIso: string;
  state: ModalState;
  event: TimelineEvent | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSaved: (input: Omit<TimelineEvent, "id">) => Promise<void>;
  onDelete: () => Promise<void>;
};

const CARD_KIND_OPTIONS: { value: EventCardKind; label: string; hint: string }[] = [
  { value: "kickoff", label: "Kick off", hint: "Verde" },
  { value: "entregables", label: "Entrega de entregables", hint: "Naranja" },
  { value: "documentos", label: "Entrega de documentos", hint: "Rojo" },
];

function renderInlineMarkdown(input: string): ReactNode[] {
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of input.matchAll(tokenRe)) {
    const full = match[0];
    const idx = match.index ?? 0;
    if (idx > last) out.push(input.slice(last, idx));

    if (full.startsWith("**") && full.endsWith("**")) {
      out.push(<strong key={`m-${key++}`}>{full.slice(2, -2)}</strong>);
    } else if (full.startsWith("*") && full.endsWith("*")) {
      out.push(<em key={`m-${key++}`}>{full.slice(1, -1)}</em>);
    } else if (full.startsWith("`") && full.endsWith("`")) {
      out.push(
        <code
          key={`m-${key++}`}
          className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800"
        >
          {full.slice(1, -1)}
        </code>,
      );
    } else if (full.startsWith("[")) {
      const link = full.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        out.push(
          <a
            key={`m-${key++}`}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-700 dark:decoration-zinc-600 dark:hover:decoration-zinc-200"
          >
            {link[1]}
          </a>,
        );
      } else {
        out.push(full);
      }
    } else {
      out.push(full);
    }
    last = idx + full.length;
  }
  if (last < input.length) out.push(input.slice(last));
  return out;
}

function renderMarkdown(text: string): ReactNode {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="ml-5 list-disc space-y-1">
        {listItems.map((item, idx) => (
          <li key={`li-${idx}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      blocks.push(
        <h3 key={`h2-${key++}`} className="text-base font-semibold">
          {renderInlineMarkdown(h2[1])}
        </h3>,
      );
      continue;
    }
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      blocks.push(
        <h2 key={`h1-${key++}`} className="text-lg font-semibold">
          {renderInlineMarkdown(h1[1])}
        </h2>,
      );
      continue;
    }

    blocks.push(
      <p key={`p-${key++}`} className="leading-relaxed">
        {renderInlineMarkdown(raw)}
      </p>,
    );
  }

  flushList();
  return blocks.length > 0 ? blocks : <p className="text-zinc-500 dark:text-zinc-400">Sin descripción.</p>;
}

export function EventModal({
  startIso,
  endIso,
  state,
  event,
  canEdit,
  onClose,
  onEdit,
  onSaved,
  onDelete,
}: Props) {
  const open = state.mode !== "closed";
  const isCreate = state.mode === "create";
  const isEdit = state.mode === "edit";
  const isView = state.mode === "view";

  const initial = useMemo<Omit<TimelineEvent, "id">>(() => {
    if (isCreate) {
      return {
        date: state.seedDateIso,
        title: "",
        description: "",
        cardKind: "entregables",
      };
    }
    if (event) {
      const { id: _id, ...rest } = event;
      return { ...rest, cardKind: rest.cardKind ?? "entregables" };
    }
    return {
      date: startIso,
      title: "",
      description: "",
      cardKind: "entregables",
    };
  }, [event, isCreate, startIso, state]);

  const [form, setForm] = useState<Omit<TimelineEvent, "id">>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setSaving(false);
    setErr(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const dayMin = 0;
  const dayMax = Math.max(0, dayOffset(startIso, endIso));
  const currentOffset = clamp(dayOffset(startIso, form.date), dayMin, dayMax);

  function updateDescriptionWithTransform(
    transform: (text: string, start: number, end: number) => {
      text: string;
      start: number;
      end: number;
    },
  ) {
    const input = descriptionRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const result = transform(form.description, start, end);
    setForm((f) => ({ ...f, description: result.text }));
    requestAnimationFrame(() => {
      if (!descriptionRef.current) return;
      descriptionRef.current.focus();
      descriptionRef.current.setSelectionRange(result.start, result.end);
    });
  }

  function wrapSelection(before: string, after = before, fallback = "texto") {
    updateDescriptionWithTransform((text, start, end) => {
      const selected = text.slice(start, end) || fallback;
      const next = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`;
      const nextStart = start + before.length;
      const nextEnd = nextStart + selected.length;
      return { text: next, start: nextStart, end: nextEnd };
    });
  }

  function prefixCurrentLine(prefix: string) {
    updateDescriptionWithTransform((text, start, end) => {
      const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const blockEndIdx = text.indexOf("\n", end);
      const lineEnd = blockEndIdx === -1 ? text.length : blockEndIdx;
      const block = text.slice(lineStart, lineEnd);
      const nextBlock = block
        .split("\n")
        .map((line) => (line.trim() ? `${prefix}${line}` : line))
        .join("\n");
      const next = `${text.slice(0, lineStart)}${nextBlock}${text.slice(lineEnd)}`;
      return { text: next, start, end: end + (nextBlock.length - block.length) };
    });
  }

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      const trimmedTitle = form.title.trim();
      if (!trimmedTitle) throw new Error("El título es obligatorio");
      const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(form.date);
      const dateInRangeOffset = dayOffset(startIso, form.date);
      if (
        !isIsoDate ||
        Number.isNaN(dateInRangeOffset) ||
        dateInRangeOffset < dayMin ||
        dateInRangeOffset > dayMax
      ) {
        throw new Error("La fecha es inválida o está fuera del rango permitido");
      }
      const payload: Omit<TimelineEvent, "id"> = {
        ...form,
        title: trimmedTitle,
        description: form.description.trim(),
        cardKind: form.cardKind ?? "entregables",
      };
      await onSaved(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar");
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = await new Promise<boolean>((resolve) => {
      let resolved = false;
      const id = toast("¿Estás seguro de borrar?", {
        description: "Es una acción irreversible.",
        duration: 12_000,
        action: {
          label: "Sí, borrar",
          onClick: () => {
            if (resolved) return;
            resolved = true;
            toast.dismiss(id);
            resolve(true);
          },
        },
        cancel: {
          label: "Cancelar",
          onClick: () => {
            if (resolved) return;
            resolved = true;
            toast.dismiss(id);
            resolve(false);
          },
        },
        onAutoClose: () => {
          if (resolved) return;
          resolved = true;
          resolve(false);
        },
        onDismiss: () => {
          if (resolved) return;
          resolved = true;
          resolve(false);
        },
      });
    });

    if (!confirmed) return;

    setSaving(true);
    setErr(null);
    try {
      await onDelete();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo borrar");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 p-6 backdrop-blur-sm dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-4xl max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-amber-500/10 p-5 dark:border-zinc-800 dark:bg-none">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              {isCreate ? "Crear" : isEdit ? "Editar" : "Detalle"} de evento
            </div>
            <div className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-200">
              {form.date}
            </div>
          </div>
          <button
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {err ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {err}
            </div>
          ) : null}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-xs text-zinc-600 dark:text-zinc-300">
                Fecha (dentro del rango)
              </label>
              <div className="flex items-center gap-3">
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100 dark:focus:border-zinc-700"
                  type="date"
                  required
                  value={form.date}
                  min={startIso}
                  max={endIso}
                  disabled={!canEdit || isView || saving}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
                <div className="hidden items-center gap-2 sm:flex">
                  <input
                    className="w-56"
                    type="range"
                    min={dayMin}
                    max={dayMax}
                    value={currentOffset}
                    disabled={!canEdit || isView || saving}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date: addDaysIso(startIso, Number(e.target.value)),
                      }))
                    }
                  />
                  <span className="w-14 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    +{currentOffset}d
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-zinc-600 dark:text-zinc-300">Título</label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100 dark:focus:border-zinc-700"
                value={form.title}
                disabled={!canEdit || isView || saving}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Lanzamiento beta, reunión, hito…"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-zinc-600 dark:text-zinc-300">
                Tipo en el timeline
              </label>
              {isView ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200">
                  {
                    CARD_KIND_OPTIONS.find((o) => o.value === (form.cardKind ?? "entregables"))
                      ?.label
                  }
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {CARD_KIND_OPTIONS.map((opt) => {
                    const active = (form.cardKind ?? "entregables") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={!canEdit || saving}
                        onClick={() => setForm((f) => ({ ...f, cardKind: opt.value }))}
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                          active
                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                            : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900/70"
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="mt-0.5 text-[11px] opacity-80">{opt.hint}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-zinc-600 dark:text-zinc-300">
                Descripción
              </label>
              {isView ? (
                <div className="max-h-[45dvh] overflow-y-auto rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100">
                  <div className="grid gap-2">{renderMarkdown(form.description)}</div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-900/20">
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                      onClick={() => wrapSelection("**")}
                      disabled={!canEdit || saving}
                    >
                      Negrita
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs italic text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                      onClick={() => wrapSelection("*")}
                      disabled={!canEdit || saving}
                    >
                      Itálica
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                      onClick={() => prefixCurrentLine("# ")}
                      disabled={!canEdit || saving}
                    >
                      Título
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                      onClick={() => prefixCurrentLine("- ")}
                      disabled={!canEdit || saving}
                    >
                      Lista
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-mono text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                      onClick={() => wrapSelection("`")}
                      disabled={!canEdit || saving}
                    >
                      Código
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                      onClick={() => wrapSelection("[", "](https://)", "enlace")}
                      disabled={!canEdit || saving}
                    >
                      Link
                    </button>
                  </div>
                  <textarea
                    ref={descriptionRef}
                    className="min-h-72 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100 dark:focus:border-zinc-700"
                    value={form.description}
                    disabled={!canEdit || saving}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Escribe la descripción. Usa la barra superior para formato."
                  />
                </>
              )}
            </div>

          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-transparent">
          <div className="flex flex-wrap items-center gap-3">
                {isView && event && canEdit ? (
              <button
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                onClick={onEdit}
              >
                Editar
              </button>
            ) : null}

            {isView && event && canEdit ? (
              <button
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                onClick={() => void handleDelete()}
                disabled={saving}
              >
                Borrar
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(isEdit || isCreate) && canEdit ? (
              <button
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

