import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDb } from "../../server/src/db/connect.js";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function withDb(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await connectDb();
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}
