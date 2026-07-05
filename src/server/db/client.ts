import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/env";
import * as schema from "./schema";

// prepare: false works correctly against both direct and PgBouncer-pooled
// connection strings (e.g. Neon's pooled endpoint) — pooled transaction mode
// is incompatible with postgres.js's prepared statements otherwise.
const queryClient = postgres(env.DATABASE_URL, { max: 10, prepare: false });

export const db = drizzle(queryClient, { schema });
