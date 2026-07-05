import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import { verifyPassword } from "@/server/auth/password";
import { loginSchema } from "@/lib/validation/auth";
import { env } from "@/server/env";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (rawCredentials) => {
      const parsed = loginSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!user?.passwordHash) return null;

      const validPassword = await verifyPassword(user.passwordHash, password);
      if (!validPassword) return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel sets this automatically in real production; explicit here so
  // self-hosted deploys (and local `next start` testing) behave the same.
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Credentials provider requires JWT sessions — Auth.js cannot look up a
  // Credentials-authenticated user via a database session record.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
