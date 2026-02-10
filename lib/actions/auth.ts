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
  const startTime = Date.now();

  const result = await Sentry.withServerActionInstrumentation(
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
        Sentry.metrics.count("auth_validation_failed", 1, {
          attributes: { action: "signup" },
        });
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
        Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
          unit: "millisecond",
          attributes: { action: "signup", result: "duplicate_email" },
        });
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

      Sentry.setUser({ id: userId, email, username: name });

      Sentry.metrics.count("auth_signup", 1, {
        attributes: { action: "signup", result: "success", user_id: userId },
      });
      Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "signup", result: "success", user_id: userId },
      });
      Sentry.logger.info("User signed up", {
        action: "auth.signup",
        user_id: userId,
        result: "success",
        duration_ms: Date.now() - startTime,
      });

      return {};
    },
  );

  if (result.error || result.fieldErrors) {
    return result;
  }

  redirect("/");
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const startTime = Date.now();

  const result = await Sentry.withServerActionInstrumentation(
    "auth.login",
    { headers: await headers() },
    async () => {
      const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      };

      const validated = loginSchema.safeParse(rawData);

      if (!validated.success) {
        Sentry.metrics.count("auth_validation_failed", 1, {
          attributes: { action: "login" },
        });
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
      const found = await db.select().from(users).where(eq(users.email, email)).limit(1);

      const user = found[0];

      if (!user) {
        Sentry.metrics.count("auth_login", 1, {
          attributes: { action: "login", result: "user_not_found" },
        });
        Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
          unit: "millisecond",
          attributes: { action: "login", result: "user_not_found" },
        });
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
        Sentry.metrics.count("auth_login", 1, {
          attributes: { action: "login", result: "invalid_password", user_id: user.id },
        });
        Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
          unit: "millisecond",
          attributes: { action: "login", result: "invalid_password", user_id: user.id },
        });
        Sentry.logger.info("Login failed - invalid password", {
          action: "auth.login",
          user_id: user.id,
          result: "invalid_password",
          duration_ms: Date.now() - startTime,
        });
        return { error: "Invalid email or password" };
      }

      await createSession(user.id);

      Sentry.setUser({ id: user.id, email: user.email, username: user.name });

      Sentry.metrics.count("auth_login", 1, {
        attributes: { action: "login", result: "success", user_id: user.id },
      });
      Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "login", result: "success", user_id: user.id },
      });
      Sentry.logger.info("User logged in", {
        action: "auth.login",
        user_id: user.id,
        result: "success",
        duration_ms: Date.now() - startTime,
      });

      return {};
    },
  );

  if (result.error || result.fieldErrors) {
    return result;
  }

  redirect("/");
}

export async function logout() {
  const startTime = Date.now();

  await Sentry.withServerActionInstrumentation(
    "auth.logout",
    { headers: await headers() },
    async () => {
      await deleteSession();

      Sentry.setUser(null);

      Sentry.metrics.count("auth_logout", 1, {
        attributes: { action: "logout", result: "success" },
      });
      Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "logout", result: "success" },
      });
      Sentry.logger.info("User logged out", {
        action: "auth.logout",
        duration_ms: Date.now() - startTime,
      });
    },
  );

  redirect("/login");
}
