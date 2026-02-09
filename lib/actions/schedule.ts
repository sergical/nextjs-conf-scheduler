"use server";

import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { userSchedules } from "@/lib/db/schema";

export async function addToSchedule(talkId: string) {
  const startTime = Date.now();
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

      if (existing.length > 0) {
        Sentry.metrics.count("schedule_add_duplicate");
        Sentry.metrics.distribution("schedule_operation_duration", Date.now() - startTime, {
          unit: "millisecond",
          attributes: { action: "add" },
        });
        Sentry.logger.info("Schedule add attempted - already exists", {
          action: "schedule.addToSchedule",
          user_id: userId,
          talk_id: talkId,
          result: "duplicate",
          duration_ms: Date.now() - startTime,
        });
        return { error: "Talk already in your schedule" };
      }

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

      Sentry.metrics.count("schedule_add_success");
      Sentry.metrics.distribution("schedule_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "add" },
      });
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

      Sentry.metrics.count("schedule_remove_success");
      Sentry.metrics.distribution("schedule_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "remove" },
      });
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
