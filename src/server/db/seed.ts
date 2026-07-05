import { config } from "dotenv";

// Loaded via dynamic import() below (not a static import) so this call runs
// first — static imports are hoisted above plain statements even in this
// file's compiled form, which would read process.env before it's populated.
config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("./client");
  const { users } = await import("./schema");
  const { hashPassword } = await import("../auth/password");

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set in the environment — skipping bootstrap admin seed."
    );
    return;
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    console.log(`Bootstrap admin ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name: "Admin", email, passwordHash });
  console.log(`Bootstrap admin account created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
