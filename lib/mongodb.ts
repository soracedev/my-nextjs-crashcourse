import mongoose, { type Mongoose } from "mongoose";

/**
 * Shape of the cached connection stored on the global object.
 * - `conn`: the resolved Mongoose instance once connected.
 * - `promise`: the in-flight connection attempt, so concurrent callers
 *   share a single connection instead of opening several.
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Extend the global scope with our cache. In development, Next.js hot-reloads
 * modules on every change, which would otherwise create a new connection each
 * time. Values on `globalThis` survive those reloads.
 */
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};
globalThis.mongooseCache = cached;

/**
 * Returns a connected Mongoose instance, reusing an existing connection
 * when one is available. Safe to call from any server-side code
 * (Route Handlers, Server Components, Server Actions).
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // Reuse the established connection.
  if (cached.conn) {
    return cached.conn;
  }

  // Start a connection only if one isn't already in progress.
  if (!cached.promise) {
    // Read the URI lazily so a missing value fails at call time,
    // not at import time (e.g. during `next build`).
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "Missing MONGODB_URI environment variable. Add it to .env.local.",
      );
    }

    cached.promise = mongoose.connect(uri, {
      // Fail fast instead of queueing model operations while disconnected.
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the failed promise so the next call can retry.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
