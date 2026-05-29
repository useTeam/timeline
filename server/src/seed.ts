import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { EventModel } from "./models/Event.js";
import { connectDb } from "./db/connect.js";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, "../data/seed.json");

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

async function loadSeedFile(): Promise<SeedFile> {
  const raw = await readFile(SEED_FILE, "utf-8");
  return JSON.parse(raw) as SeedFile;
}

async function main() {
  const force = process.argv.includes("--force");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Falta MONGODB_URI (definila en server/.env)");
    process.exit(1);
  }
  if (uri.includes("cluster.example.mongodb.net") || uri.includes("USER:PASSWORD")) {
    console.error(
      "MONGODB_URI en server/.env sigue siendo el ejemplo.\n" +
        "Copiá tu URI real de MongoDB Atlas (Connect → Drivers → connection string).",
    );
    process.exit(1);
  }

  await connectDb();

  const existing = await EventModel.countDocuments();
  if (existing > 0 && !force) {
    console.log(
      `[db:seed] Ya hay ${existing} eventos en MongoDB. Usá --force para reemplazar.`,
    );
    await mongoose.disconnect();
    return;
  }

  if (force && existing > 0) {
    await EventModel.deleteMany({});
    console.log(`[db:seed] Colección vaciada (${existing} documentos).`);
  }

  const data = await loadSeedFile();
  if (data.events.length === 0) {
    console.error("[db:seed] seed.json no tiene eventos.");
    process.exit(1);
  }

  await EventModel.insertMany(data.events);
  console.log(`[db:seed] ${data.events.length} eventos cargados en MongoDB desde data/seed.json`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
