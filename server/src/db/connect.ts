import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDb(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI no está definida");
  }

  if (global.__mongooseConn) {
    return global.__mongooseConn;
  }

  global.__mongooseConn = mongoose.connect(uri);
  return global.__mongooseConn;
}
