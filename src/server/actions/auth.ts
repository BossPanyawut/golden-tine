"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/server/auth/config";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validation/auth";
import { env } from "@/server/env";

export type AuthActionResult = { error: string } | undefined;

export async function loginAction(
  input: LoginInput
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerAction(
  input: RegisterInput
): Promise<AuthActionResult> {
  if (!env.ALLOW_PUBLIC_SIGNUP) {
    return { error: "Registration is currently closed." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name, email, passwordHash });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
