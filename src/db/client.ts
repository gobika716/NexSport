import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

// Resolve a stable DB file path. In dev this lives in the project root.
function resolveDbPath(): string {
  const envPath = process.env["NEXSPORT_DB_PATH"];
  if (envPath) return envPath;
  return path.join(process.cwd(), "nexsport.db");
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
export { dbPath };
