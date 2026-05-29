import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withDb } from "./lib/withDb.js";

async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true });
}

export default withDb(handler);
