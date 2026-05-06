import type { EventCardKind, TimelineEvent } from "../types";
import { addDaysIso, clamp, dayOffset, daysBetweenInclusive } from "../lib/dates";

function cardKindOf(ev: TimelineEvent): EventCardKind {
  return ev.cardKind ?? "entregables";
}

const CARD_THEME: Record<
  EventCardKind,
  { badge: string; dot: string; glow: string }
> = {
  kickoff: {
    badge:
      "border-emerald-300/85 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800/55 dark:bg-emerald-950/35 dark:text-emerald-100",
    dot: "bg-emerald-500",
    glow: "shadow-[0_0_0_6px_rgba(16,185,129,0.20),0_18px_30px_rgba(16,185,129,0.22)]",
  },
  entregables: {
    badge:
      "border-orange-300/90 bg-orange-50/95 text-orange-950 dark:border-orange-800/55 dark:bg-orange-950/30 dark:text-orange-100",
    dot: "bg-orange-500",
    glow: "shadow-[0_0_0_6px_rgba(249,115,22,0.22),0_18px_30px_rgba(249,115,22,0.20)]",
  },
  documentos: {
    badge:
      "border-red-300/90 bg-red-50/95 text-red-950 dark:border-red-800/55 dark:bg-red-950/30 dark:text-red-100",
    dot: "bg-red-500",
    glow: "shadow-[0_0_0_6px_rgba(239,68,68,0.22),0_18px_30px_rgba(239,68,68,0.20)]",
  },
};

function estimateCardHeight(ev: TimelineEvent, cardWidthPx: number): number {
  const approxCharPx = 7.1;
  const charsPerLine = Math.max(16, Math.floor((cardWidthPx - 36) / approxCharPx));
  const titleLines = Math.max(1, Math.ceil(ev.title.length / charsPerLine));
  const titleH = 8 + titleLines * 21;
  const dateRow = 18;
  const descH = ev.description?.trim() ? 44 : 22;
  const scenH = !ev.confirmed && ev.scenarios.length > 0 ? 22 : 0;
  const padding = 30;
  return Math.min(248, padding + titleH + dateRow + descH + scenH);
}

type Props = {
  startIso: string;
  endIso: string;
  events: TimelineEvent[];
  pxPerDay: number;
  loading: boolean;
  canCreate: boolean;
  onPointClick: (eventId: number) => void;
  onCreateAtDate: (dateIso: string) => void;
};

function monthLabel(iso: string): string {
  const y = iso.slice(0, 4);
  const m = iso.slice(5, 7);
  const map: Record<string, string> = {
    "01": "Ene",
    "02": "Feb",
    "03": "Mar",
    "04": "Abr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Ago",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dic",
  };
  return `${map[m] ?? m} ${y}`;
}

export function Timeline({
  startIso,
  endIso,
  events,
  pxPerDay,
  loading,
  canCreate,
  onPointClick,
  onCreateAtDate,
}: Props) {
  const totalDays = daysBetweenInclusive(startIso, endIso);
  const widthPx = Math.max(800, totalDays * pxPerDay);
  const edgeGutterPx = 160; // prevents first/last cards being clipped

  // Vertical layout (top to bottom):
  // month labels, upper cards, track, lower cards
  const monthBandH = 48;
  const cardWidthPx = clamp(Math.round(232 + pxPerDay * 7), 248, 380);
  const minSpacingPx = cardWidthPx + 36;
  const rowStridePx = clamp(Math.round(100 + pxPerDay * 2.4), 108, 138);
  const laneCount = 6;
  /** Extra margen además de bandPad entre borde de pista y tarjetas. */
  const clearanceFromTrack = 50;
  const trackBandH = 86;
  const bandPad = 16;
  /** Misma distancia del centro del eje al borde interior de la tarjeta (arriba y abajo). */
  const innerGap =
    Math.ceil(trackBandH / 2) + bandPad + clearanceFromTrack;

  const upperBandCore = clamp(Math.round(168 + pxPerDay * 3.2), 184, 248);
  const bandBase = upperBandCore + clearanceFromTrack;
  const maxRowIdx = Math.floor((laneCount - 1) / 2);
  const layoutCardH = 248;

  const minTrackCenterY =
    monthBandH + bandPad + innerGap + layoutCardH + maxRowIdx * rowStridePx;
  const upperBandMin =
    minTrackCenterY - monthBandH - Math.floor(trackBandH / 2);
  const lowerBandMin =
    innerGap +
    maxRowIdx * rowStridePx +
    layoutCardH +
    bandPad -
    Math.floor(trackBandH / 2);

  let upperBandH = Math.max(bandBase, upperBandMin);
  const lowerBandH = Math.max(bandBase, lowerBandMin);

  const monthTicks: number[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const iso = addDaysIso(startIso, i);
    if (iso.endsWith("-01") || i === 0) monthTicks.push(i);
  }
  if (monthTicks.at(-1) !== totalDays - 1) monthTicks.push(totalDays - 1);

  const laneLastX = new Array<number>(laneCount).fill(-Infinity);

  const positioned = [...events]
    .map((ev, idx) => {
      const d = dayOffset(startIso, ev.date);
      const x = edgeGutterPx + d * pxPerDay;
      return { ev, d, x, idx };
    })
    .filter((p) => p.d >= 0 && p.d <= totalDays - 1)
    .sort((a, b) => a.d - b.d || a.idx - b.idx)
    .map((p) => {
      let lane = 0;
      for (let i = 0; i < laneCount; i += 1) {
        if (p.x - laneLastX[i] >= minSpacingPx) {
          lane = i;
          break;
        }
        lane = (i + 1) % laneCount;
      }
      laneLastX[lane] = p.x;
      return { ...p, lane };
    });

  function buildEventLayouts(trackCy: number) {
    return positioned.map(({ ev, x, lane }) => {
      const up = lane % 2 === 0;
      const row = Math.floor(lane / 2);
      const cardH = estimateCardHeight(ev, cardWidthPx);
      const yCardAnchor = up
        ? trackCy - innerGap - cardH - row * rowStridePx
        : trackCy + innerGap + row * rowStridePx;
      const dotTop = trackCy - 12;
      const dotCenterY = dotTop + 12;
      const yLineTop = up ? yCardAnchor + cardH : dotCenterY;
      const yLineBottom = up ? dotCenterY : yCardAnchor;
      const kind = cardKindOf(ev);
      const theme = CARD_THEME[kind];
      const unconfirmedRing = !ev.confirmed
        ? "ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white dark:ring-amber-500/60 dark:ring-offset-zinc-950"
        : "";
      return {
        ev,
        x,
        up,
        yCardAnchor,
        dotTop,
        dotCenterY,
        yLineTop,
        yLineBottom,
        color: theme.dot,
        glow: theme.glow,
        badge: theme.badge,
        unconfirmedRing,
      };
    });
  }

  let trackTopY = monthBandH + upperBandH;
  let trackCenterY = trackTopY + Math.floor(trackBandH / 2);
  let eventLayouts = buildEventLayouts(trackCenterY);

  /** Recorta hueco vacío arriba: sube el eje hasta dejar solo un margen bajo la franja de meses. */
  const topSlackPx = 6;
  const targetUpperCardTop = monthBandH + bandPad + topSlackPx;
  const upperCardTops = eventLayouts
    .filter((L) => L.up)
    .map((L) => L.yCardAnchor);
  const minUpperCardTop = upperCardTops.length
    ? Math.min(...upperCardTops)
    : Infinity;
  if (minUpperCardTop !== Infinity && minUpperCardTop > targetUpperCardTop) {
    const trimTop = minUpperCardTop - targetUpperCardTop;
    upperBandH = Math.max(bandBase, upperBandH - trimTop);
    trackTopY = monthBandH + upperBandH;
    trackCenterY = trackTopY + Math.floor(trackBandH / 2);
    eventLayouts = buildEventLayouts(trackCenterY);
  }

  /** Alto del lienzo: recorta hueco vacío abajo sin mover cards ni el eje. */
  const trackBottomY = trackTopY + trackBandH;
  const canvasHeightBudget =
    monthBandH + upperBandH + trackBandH + lowerBandH;
  const contentBottomPx = eventLayouts.reduce((max, L) => {
    const h = estimateCardHeight(L.ev, cardWidthPx);
    return Math.max(max, L.yCardAnchor + h);
  }, trackBottomY);
  const canvasHeight = Math.min(
    canvasHeightBudget,
    Math.max(
      trackBottomY + 24,
      contentBottomPx + 16,
      monthBandH + 72,
    ),
  );

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canCreate) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - edgeGutterPx;
    const day = clamp(Math.round(x / pxPerDay), 0, totalDays - 1);
    onCreateAtDate(addDaysIso(startIso, day));
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-2 text-sm text-zinc-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:text-zinc-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            Kick off
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
            Entrega de entregables
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
            Entrega de documentos
          </span>
          <span className="inline-flex items-center gap-2 sm:ml-1">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
            No confirmado (borde ámbar)
          </span>
        </div>
        <div className="font-mono">{events.length} eventos</div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/85 backdrop-blur-lg shadow-[0_12px_40px_rgba(2,6,23,0.10)] dark:border-zinc-800 dark:bg-zinc-950/40 dark:shadow-none">
        <div
          className="relative px-6 py-3"
          style={{ width: `${widthPx + edgeGutterPx * 2 + 48}px` }}
        >
          <div
          className={`relative select-none ${canCreate ? "cursor-crosshair" : "cursor-default"}`}
            style={{ height: canvasHeight }}
            onClick={handleTrackClick}
            role="button"
            tabIndex={0}
          >
            {/* vertical month guides + month labels (top band) */}
            {monthTicks.map((d) => {
              const left = edgeGutterPx + d * pxPerDay;
              const iso = addDaysIso(startIso, d);
              return (
                <div key={d} className="absolute top-0 bottom-0" style={{ left }}>
                  <div className="absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-900" />
                  <div className="absolute top-3 -translate-x-1/2 whitespace-nowrap rounded-full border border-zinc-200 bg-white/90 px-2 py-0.5 font-mono text-[11px] text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
                    {d === 0 || iso.endsWith("-01") ? monthLabel(iso) : iso}
                  </div>
                </div>
              );
            })}

            {/* main track band background */}
            <div
              className="absolute left-0 right-0 z-[1] rounded-3xl bg-white/65 shadow-[0_0_0_1px_rgba(15,23,42,0.10)] backdrop-blur-md dark:bg-zinc-950/0 dark:shadow-none"
              style={{ top: trackTopY + 10, height: trackBandH - 20 }}
            />
            {/* main track */}
            <div
              className="absolute left-0 right-0 z-[1] h-2 rounded-full bg-gradient-to-r from-indigo-600/55 via-emerald-500/45 to-amber-500/55 dark:from-indigo-500/25 dark:via-emerald-500/20 dark:to-amber-500/25"
              style={{ top: trackCenterY }}
            />
            <div
              className="absolute left-0 right-0 z-[1] h-2 rounded-full blur-[14px] opacity-80 bg-gradient-to-r from-indigo-500/25 via-emerald-500/20 to-amber-500/25 dark:opacity-60"
              style={{ top: trackCenterY }}
            />

            {/* capa inferior: conectores + tarjetas (los puntos van arriba para no taparlos) */}
            {eventLayouts.map(
              ({
                ev,
                x,
                up,
                yCardAnchor,
                dotCenterY,
                yLineTop,
                yLineBottom,
                badge,
                unconfirmedRing,
              }) => (
                <div
                  key={ev.id}
                  className="absolute z-[8]"
                  style={{ left: x, top: 0 }}
                >
                  <div
                    className="absolute -translate-x-1/2"
                    style={{
                      top: Math.min(yLineTop, yLineBottom),
                      height: Math.abs(yLineBottom - yLineTop),
                      width: "1px",
                      background: "rgb(161 161 170)",
                    }}
                  />
                  <div
                    className="absolute -translate-x-1/2"
                    style={{
                      top: up ? dotCenterY - 12 : dotCenterY + 6,
                      width: 0,
                      height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: up ? undefined : "8px solid rgb(161 161 170)",
                      borderBottom: up ? "8px solid rgb(161 161 170)" : undefined,
                    }}
                  />
                  <button
                    type="button"
                    className={`absolute -translate-x-1/2 rounded-2xl border p-4 text-left shadow-sm backdrop-blur hover:brightness-[1.02] dark:hover:brightness-110 ${badge} ${unconfirmedRing}`}
                    style={{ top: yCardAnchor, width: cardWidthPx, maxWidth: cardWidthPx }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPointClick(ev.id);
                    }}
                  >
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="text-base font-semibold leading-snug text-balance break-words">
                        {ev.title}
                      </div>
                      <div className="font-mono text-xs opacity-90">
                        {ev.date.slice(5)}
                      </div>
                    </div>
                    {ev.description ? (
                      <div className="mt-2 line-clamp-3 break-words text-sm opacity-90">
                        {ev.description.replace(/\s+/g, " ").trim()}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm opacity-70">Sin descripción</div>
                    )}
                    {!ev.confirmed && ev.scenarios.length > 0 ? (
                      <div className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                        {ev.scenarios.length} escenarios
                      </div>
                    ) : null}
                  </button>
                </div>
              ),
            )}

            {/* capa superior: puntos siempre visibles por encima de cualquier tarjeta */}
            {eventLayouts.map(({ ev, x, dotTop, color, glow }) => (
              <div
                key={`dot-${ev.id}`}
                className="absolute z-[25]"
                style={{ left: x, top: 0 }}
              >
                <button
                  type="button"
                  className="group absolute -translate-x-1/2"
                  style={{ top: dotTop }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPointClick(ev.id);
                  }}
                  title={`${ev.date} — ${ev.title}`}
                >
                  <span
                    className={`absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition group-hover:opacity-100 ${glow} dark:opacity-60`}
                  />
                  <span
                    className={`relative block h-6 w-6 rounded-full ${color} ring-[6px] ring-white shadow-[0_10px_24px_rgba(2,6,23,0.22)] transition group-hover:scale-125 dark:ring-zinc-950 dark:shadow-[0_10px_24px_rgba(0,0,0,0.55)]`}
                  />
                  <span className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_rgba(15,23,42,0.22)] dark:shadow-[0_0_0_2px_rgba(255,255,255,0.10)]" />
                </button>
              </div>
            ))}

            {loading ? (
              <div className="absolute inset-0 z-[40] flex items-center justify-center bg-white/40 text-sm text-zinc-600 backdrop-blur-[1px] dark:bg-zinc-950/40 dark:text-zinc-400">
                Cargando…
              </div>
            ) : null}
          </div>

          {canCreate ? (
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Click sobre la línea para crear un evento en esa fecha. Rango:{" "}
              <span className="font-mono">{startIso}</span> →{" "}
              <span className="font-mono">{endIso}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

