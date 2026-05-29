/** Estilo de tarjeta en el timeline (color / categoría del hito). */
export type EventCardKind = "kickoff" | "entregables" | "documentos";

export type TimelineEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  /** Si falta (datos viejos), el timeline asume `entregables`. */
  cardKind?: EventCardKind;
};
