import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit runs outside Next.js, so it doesn't get Next's automatic
// .env.local loading — load it explicitly. In CI/production, real env vars
// are already set and this file simply won't exist, so config() no-ops.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
