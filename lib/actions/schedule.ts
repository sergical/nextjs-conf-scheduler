"use server";

import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { userSchedules } from "@/lib/db/schema";

export async function addToSchedule(talkId: string) {
  const startTime = Date.now();

  return Sentry.withServerActionInstrumentation(
    "schedule.addToSchedule",
    { headers: await headers() },
    async () => {
      const { userId } = await requireAuth();

      // Check if already in schedule
      const existing = await db
        .select()
        .from(userSchedules)
        .where(and(eq(userSchedules.userId, userId), eq(userSchedules.talkId, talkId)))
        .limit(1);

      if (existing.length > 0) {
        Sentry.logger.info("Schedule add attempted - already exists", {
          action: "schedule.addToSchedule",
          user_id: userId,
          talk_id: talkId,
          result: "duplicate",
          duration_ms: Date.now() - startTime,
        });
        return { error: "Talk already in your schedule" };
      }

      await db.insert(userSchedules).values({
        userId,
        talkId,
        addedAt: Math.floor(Date.now() / 1000),
      });

      revalidatePath("/");
      revalidatePath("/my-schedule");
      revalidatePath(`/talks/${talkId}`);

      Sentry.logger.info("Schedule item added", {
        action: "schedule.addToSchedule",
        user_id: userId,
        talk_id: talkId,
        result: "success",
        duration_ms: Date.now() - startTime,
      });

      return { success: true };
    },
  );
}

export async function removeFromSchedule(talkId: string) {
  const startTime = Date.now();

  return Sentry.withServerActionInstrumentation(
    "schedule.removeFromSchedule",
    { headers: await headers() },
    async () => {
      const { userId } = await requireAuth();

      await db
        .delete(userSchedules)
        .where(and(eq(userSchedules.userId, userId), eq(userSchedules.talkId, talkId)));

      revalidatePath("/");
      revalidatePath("/my-schedule");
      revalidatePath(`/talks/${talkId}`);

      Sentry.logger.info("Schedule item removed", {
        action: "schedule.removeFromSchedule",
        user_id: userId,
        talk_id: talkId,
        result: "success",
        duration_ms: Date.now() - startTime,
      });

      return { success: true };
    },
  );
}
