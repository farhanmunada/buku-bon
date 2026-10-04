import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diatur. Harap konfigurasi DATABASE_URL (Neon PostgreSQL) di file .env"
    );
  }

  const sql: NeonQueryFunction<boolean, boolean> = neon(connectionString);
  _db = drizzle(sql, { schema });
  return _db;
}

// Lazy proxy for db so top-level imports don't throw during build if DATABASE_URL is not set at build time
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const database = getDb();
    const val = (database as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === "function") {
      return val.bind(database);
    }
    return val;
  },
});

export * from "./schema";
