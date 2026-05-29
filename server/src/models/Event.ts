import mongoose, { Schema } from "mongoose";

const scenarioSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    details: { type: String, required: true },
  },
  { _id: false },
);

const eventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    confirmed: { type: Boolean, default: false },
    scenarios: { type: [scenarioSchema], default: [] },
    cardKind: {
      type: String,
      enum: ["kickoff", "entregables", "documentos"],
      required: false,
    },
  },
  { versionKey: false, _id: false },
);

export type EventDoc = mongoose.InferSchemaType<typeof eventSchema>;

export const EventModel = mongoose.model("Event", eventSchema);
