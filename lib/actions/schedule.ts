"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { userSchedules } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/dal";
import { and, eq } from "drizzle-orm";

export async function addToSchedule(talkId: string) {
  const { userId } = await requireAuth();

  // Check if already in schedule
  const existing = await db
    .select()
    .from(userSchedules)
    .where(and(eq(userSchedules.userId, userId), eq(userSchedules.talkId, talkId)))
    .limit(1);

  if (existing.length > 0) {
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

  return { success: true };
}

export async function removeFromSchedule(talkId: string) {
  const { userId } = await requireAuth();

  await db
    .delete(userSchedules)
    .where(and(eq(userSchedules.userId, userId), eq(userSchedules.talkId, talkId)));

  revalidatePath("/");
  revalidatePath("/my-schedule");
  revalidatePath(`/talks/${talkId}`);

  return { success: true };
}
