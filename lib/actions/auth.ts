"use server";

import * as Sentry from "@sentry/nextjs";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  return Sentry.withServerActionInstrumentation(
    "auth.signup",
    { headers: await headers() },
    async () => {
      const rawData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      };

      const validated = signupSchema.safeParse(rawData);

      if (!validated.success) {
        return {
          fieldErrors: validated.error.flatten().fieldErrors,
        };
      }

      const { name, email, password } = validated.data;

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existingUser.length > 0) {
        return { error: "An account with this email already exists" };
      }

      // Hash password and create user
      const hashedPassword = await hash(password, 10);
      const userId = crypto.randomUUID();

      await db.insert(users).values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        createdAt: Date.now(),
      });

      await createSession(userId);
      redirect("/");
    },
  );
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  return Sentry.withServerActionInstrumentation(
    "auth.login",
    { headers: await headers() },
    async () => {
      const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      };

      const validated = loginSchema.safeParse(rawData);

      if (!validated.success) {
        return {
          fieldErrors: validated.error.flatten().fieldErrors,
        };
      }

      const { email, password } = validated.data;

      // Find user
      const found = await db.select().from(users).where(eq(users.email, email)).limit(1);

      const user = found[0];

      if (!user) {
        return { error: "Invalid email or password" };
      }

      // Verify password
      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        return { error: "Invalid email or password" };
      }

      await createSession(user.id);
      redirect("/");
    },
  );
}

export async function logout() {
  await Sentry.withServerActionInstrumentation(
    "auth.logout",
    { headers: await headers() },
    async () => {
      await deleteSession();
    },
  );

  redirect("/login");
}
