import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { db } from "@/lib/db";
import { userSchedules, talks, speakers, tracks, rooms } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const scheduleRouter = router({
  // Get user's saved schedule
  getUserSchedule: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select({
        talkId: userSchedules.talkId,
        addedAt: userSchedules.addedAt,
        talk: {
          id: talks.id,
          title: talks.title,
          description: talks.description,
          startTime: talks.startTime,
          endTime: talks.endTime,
          level: talks.level,
          format: talks.format,
        },
        speaker: {
          id: speakers.id,
          name: speakers.name,
          avatar: speakers.avatar,
          company: speakers.company,
        },
        track: {
          id: tracks.id,
          name: tracks.name,
          color: tracks.color,
        },
        room: {
          id: rooms.id,
          name: rooms.name,
        },
      })
      .from(userSchedules)
      .innerJoin(talks, eq(userSchedules.talkId, talks.id))
      .innerJoin(speakers, eq(talks.speakerId, speakers.id))
      .innerJoin(tracks, eq(talks.trackId, tracks.id))
      .innerJoin(rooms, eq(talks.roomId, rooms.id))
      .where(eq(userSchedules.userId, ctx.session.userId))
      .orderBy(talks.startTime);

    return result;
  }),

  // Check if talks have time conflicts
  checkConflicts: protectedProcedure
    .input(z.object({ talkIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (input.talkIds.length === 0) return { conflicts: [] };

      const talkTimes = await db
        .select({
          id: talks.id,
          title: talks.title,
          startTime: talks.startTime,
          endTime: talks.endTime,
        })
        .from(talks)
        .where(inArray(talks.id, input.talkIds));

      const conflicts: Array<{ talk1: string; talk2: string }> = [];

      // Check each pair for overlaps
      for (let i = 0; i < talkTimes.length; i++) {
        for (let j = i + 1; j < talkTimes.length; j++) {
          const a = talkTimes[i];
          const b = talkTimes[j];

          // Check if times overlap
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            conflicts.push({ talk1: a.id, talk2: b.id });
          }
        }
      }

      return { conflicts, talks: talkTimes };
    }),

  // Check if a specific talk is in user's schedule
  isInSchedule: protectedProcedure
    .input(z.object({ talkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(userSchedules)
        .where(
          and(
            eq(userSchedules.userId, ctx.session.userId),
            eq(userSchedules.talkId, input.talkId)
          )
        )
        .limit(1);

      return result.length > 0;
    }),
});
