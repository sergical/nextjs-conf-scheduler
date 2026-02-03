"use server";

import * as Sentry from "@sentry/nextjs";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
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
  const startTime = Date.now();

  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = signupSchema.safeParse(rawData);

  if (!validated.success) {
    Sentry.logger.warn("Signup validation failed", {
      action: "auth.signup",
      validation_errors: Object.keys(validated.error.flatten().fieldErrors).join(", "),
      duration_ms: Date.now() - startTime,
    });
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validated.data;

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUser.length > 0) {
    Sentry.logger.info("Signup attempted with existing email", {
      action: "auth.signup",
      result: "duplicate_email",
      duration_ms: Date.now() - startTime,
    });
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

  Sentry.logger.info("User signed up", {
    action: "auth.signup",
    user_id: userId,
    result: "success",
    duration_ms: Date.now() - startTime,
  });

  redirect("/");
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const startTime = Date.now();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    Sentry.logger.warn("Login validation failed", {
      action: "auth.login",
      duration_ms: Date.now() - startTime,
    });
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  // Find user
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const user = result[0];

  if (!user) {
    Sentry.logger.info("Login failed - user not found", {
      action: "auth.login",
      result: "user_not_found",
      duration_ms: Date.now() - startTime,
    });
    return { error: "Invalid email or password" };
  }

  // Verify password
  const passwordMatch = await compare(password, user.password);

  if (!passwordMatch) {
    Sentry.logger.info("Login failed - invalid password", {
      action: "auth.login",
      user_id: user.id,
      result: "invalid_password",
      duration_ms: Date.now() - startTime,
    });
    return { error: "Invalid email or password" };
  }

  await createSession(user.id);

  Sentry.logger.info("User logged in", {
    action: "auth.login",
    user_id: user.id,
    result: "success",
    duration_ms: Date.now() - startTime,
  });

  redirect("/");
}

export async function logout() {
  const startTime = Date.now();

  await deleteSession();

  Sentry.logger.info("User logged out", {
    action: "auth.logout",
    duration_ms: Date.now() - startTime,
  });

  redirect("/login");
}
