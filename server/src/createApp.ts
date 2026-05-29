import cors from "cors";
import express from "express";
import { connectDb } from "./db/connect.js";
import { eventsRouter } from "./routes/events.js";

export async function createApp(): Promise<express.Express> {
  await connectDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "Timeline API",
      status: "ok",
      endpoints: {
        health: "GET /health",
        events: "GET /events",
        event: "GET /events/:id",
      },
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/events", eventsRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ message: "Error interno del servidor" });
    },
  );

  return app;
}
