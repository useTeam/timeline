import { Router } from "express";
import { EventModel } from "../models/Event.js";
import { newEventId } from "../lib/newEventId.js";

export const eventsRouter = Router();

function toClient(doc: { toObject: () => Record<string, unknown> }) {
  return doc.toObject();
}

eventsRouter.get("/", async (req, res, next) => {
  try {
    const sortField = (req.query._sort as string) ?? "date";
    const order = (req.query._order as string) === "desc" ? -1 : 1;

    const events = await EventModel.find()
      .sort({ [sortField]: order })
      .lean();

    res.json(events);
  } catch (err) {
    next(err);
  }
});

eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = await EventModel.findOne({ id: req.params.id });
    if (!event) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }
    res.json(toClient(event));
  } catch (err) {
    next(err);
  }
});

eventsRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const id = typeof body.id === "string" && body.id ? body.id : newEventId();

    const event = await EventModel.create({ ...body, id });
    res.status(201).json(toClient(event));
  } catch (err) {
    next(err);
  }
});

eventsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id: _ignored, ...patch } = req.body as Record<string, unknown>;

    const event = await EventModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: patch },
      { new: true, runValidators: true },
    );

    if (!event) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }

    res.json(toClient(event));
  } catch (err) {
    next(err);
  }
});

eventsRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await EventModel.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
