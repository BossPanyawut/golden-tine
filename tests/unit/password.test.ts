import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("round-trips a correct password", async () => {
    const hash = await hashPassword("Sup3r-Secret!");
    await expect(verifyPassword(hash, "Sup3r-Secret!")).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Sup3r-Secret!");
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("Sup3r-Secret!"),
      hashPassword("Sup3r-Secret!"),
    ]);
    expect(a).not.toBe(b);
  });
});
