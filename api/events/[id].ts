import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EventModel } from "../../server/src/models/Event.js";
import { withDb } from "../lib/withDb.js";

function eventIdFromQuery(req: VercelRequest): string | null {
  const raw = req.query.id;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return null;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const id = eventIdFromQuery(req);
  if (!id) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  if (req.method === "GET") {
    const event = await EventModel.findOne({ id }).lean();
    if (!event) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }
    res.status(200).json(event);
    return;
  }

  if (req.method === "PATCH") {
    const { id: _ignored, ...patch } = (req.body ?? {}) as Record<string, unknown>;
    const event = await EventModel.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    if (!event) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }
    res.status(200).json(event);
    return;
  }

  if (req.method === "DELETE") {
    const result = await EventModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "GET, PATCH, DELETE");
  res.status(405).json({ message: "Método no permitido" });
}

export default withDb(handler);
