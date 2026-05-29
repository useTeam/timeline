import dotenv from "dotenv";
import { createApp } from "./createApp.js";
import { seedIfEmpty } from "./seed.js";
import { connectDb } from "./db/connect.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  await connectDb();
  await seedIfEmpty();

  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
