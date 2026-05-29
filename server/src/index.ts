import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { eventsRouter } from "./routes/events.js";
import { seedIfEmpty } from "./seed.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI no está definida (ver server/.env.example)");
  }

  await mongoose.connect(uri);
  await seedIfEmpty();

  const app = express();
  app.use(cors());
  app.use(express.json());

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

  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
