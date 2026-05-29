import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EventModel } from "../../server/src/models/Event.js";
import { newEventId } from "../../server/src/lib/newEventId.js";
import { withDb } from "../lib/withDb.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const sortField = (req.query._sort as string) ?? "date";
    const order = req.query._order === "desc" ? -1 : 1;
    const events = await EventModel.find().sort({ [sortField]: order }).lean();
    res.status(200).json(events);
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const id = typeof body.id === "string" && body.id ? body.id : newEventId();
    const event = await EventModel.create({ ...body, id });
    res.status(201).json(event.toObject());
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ message: "Método no permitido" });
}

export default withDb(handler);
