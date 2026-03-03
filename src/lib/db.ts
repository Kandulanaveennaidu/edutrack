import mongoose from "mongoose";

// Read MONGODB_URI lazily to ensure .env.local is loaded by Next.js first
function getMongoURI(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[DB] MONGODB_URI is not set! Available env keys:", Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('NEXT') || k === 'NODE_ENV').join(', '));
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    // Verify the cached connection is still alive
    if (cached.conn.connection.readyState === 1) {
      return cached.conn;
    }
    // Connection dropped — clear cache and reconnect
    console.warn("[DB] Cached connection lost (readyState:", cached.conn.connection.readyState, "). Reconnecting...");
    cached.conn = null;
    cached.promise = null;
  }

  const MONGODB_URI = getMongoURI();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      family: 4,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };
    console.log("[DB] Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("[DB] Connected successfully to:", m.connection.host);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    const err = e as Error;
    console.error("[DB] Connection failed:", err.name, "-", err.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
