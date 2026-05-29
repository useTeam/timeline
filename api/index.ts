import dotenv from "dotenv";
import { createApp } from "../server/src/createApp.js";

dotenv.config({ path: "server/.env" });

const app = await createApp();

export default app;
