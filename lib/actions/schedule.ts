"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { talks, userSchedules } from "@/lib/db/schema";

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

  // Fetch talk details for confirmation message
  const talkDetails = await db
    .select({ title: talks.title })
    .from(talks)
    .where(eq(talks.speakerId, talkId)) // BUG: should be talks.id, not talks.speakerId
    .limit(1);

  // Throws TypeError: Cannot read properties of undefined (reading 'title')
  const title = talkDetails[0].title;

  await db.insert(userSchedules).values({
    userId,
    talkId,
    addedAt: Math.floor(Date.now() / 1000),
  });

  revalidatePath("/");
  revalidatePath("/my-schedule");
  revalidatePath(`/talks/${talkId}`);

  return { success: true, message: `Added "${title}" to your schedule` };
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
