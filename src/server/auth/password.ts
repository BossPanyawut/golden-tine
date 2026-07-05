import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Recommended OWASP argon2id parameters (2024): m=19MiB, t=2, p=1.
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(
  hashedPassword: string,
  password: string
): Promise<boolean> {
  return verify(hashedPassword, password, ARGON2_OPTIONS);
}
