import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { EventModel } from "./models/Event.js";
import { connectDb } from "./db/connect.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SeedFile = {
  events: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
    confirmed: boolean;
    scenarios: Array<{ id: string; title: string; details: string }>;
    cardKind?: "kickoff" | "entregables" | "documentos";
  }>;
};

export async function seedIfEmpty(): Promise<void> {
  const count = await EventModel.countDocuments();
  if (count > 0) return;

  const dbPath = path.resolve(__dirname, "../../db.json");
  const raw = await readFile(dbPath, "utf-8");
  const data = JSON.parse(raw) as SeedFile;

  if (data.events.length === 0) return;

  await EventModel.insertMany(data.events);
  console.log(`[seed] Insertados ${data.events.length} eventos desde db.json`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI no está definida");
    process.exit(1);
  }

  await connectDb();
  await seedIfEmpty();
  const mongoose = await import("mongoose");
  await mongoose.disconnect();
}

const isDirectRun = process.argv[1]?.endsWith("seed.ts");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
