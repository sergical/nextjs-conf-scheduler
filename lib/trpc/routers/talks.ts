import { z } from "zod";
import { router, publicProcedure } from "../init";
import { db } from "@/lib/db";
import { talks, speakers, tracks, rooms } from "@/lib/db/schema";
import { eq, like, and, or } from "drizzle-orm";

export const talksRouter = router({
  // Get all talks with speaker and track info
  list: publicProcedure.query(async () => {
    const result = await db
      .select({
        id: talks.id,
        title: talks.title,
        description: talks.description,
        startTime: talks.startTime,
        endTime: talks.endTime,
        level: talks.level,
        format: talks.format,
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
      .from(talks)
      .innerJoin(speakers, eq(talks.speakerId, speakers.id))
      .innerJoin(tracks, eq(talks.trackId, tracks.id))
      .innerJoin(rooms, eq(talks.roomId, rooms.id))
      .orderBy(talks.startTime);

    return result;
  }),

  // Get single talk by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          id: talks.id,
          title: talks.title,
          description: talks.description,
          startTime: talks.startTime,
          endTime: talks.endTime,
          level: talks.level,
          format: talks.format,
          speaker: {
            id: speakers.id,
            name: speakers.name,
            bio: speakers.bio,
            avatar: speakers.avatar,
            company: speakers.company,
            role: speakers.role,
            twitter: speakers.twitter,
          },
          track: {
            id: tracks.id,
            name: tracks.name,
            color: tracks.color,
            description: tracks.description,
          },
          room: {
            id: rooms.id,
            name: rooms.name,
            capacity: rooms.capacity,
          },
        })
        .from(talks)
        .innerJoin(speakers, eq(talks.speakerId, speakers.id))
        .innerJoin(tracks, eq(talks.trackId, tracks.id))
        .innerJoin(rooms, eq(talks.roomId, rooms.id))
        .where(eq(talks.id, input.id))
        .limit(1);

      return result[0] ?? null;
    }),

  // Search talks with filters
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        trackId: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        format: z.enum(["talk", "workshop", "keynote", "panel"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.query) {
        conditions.push(
          or(
            like(talks.title, `%${input.query}%`),
            like(talks.description, `%${input.query}%`)
          )
        );
      }
      if (input.trackId) {
        conditions.push(eq(talks.trackId, input.trackId));
      }
      if (input.level) {
        conditions.push(eq(talks.level, input.level));
      }
      if (input.format) {
        conditions.push(eq(talks.format, input.format));
      }

      const result = await db
        .select({
          id: talks.id,
          title: talks.title,
          description: talks.description,
          startTime: talks.startTime,
          endTime: talks.endTime,
          level: talks.level,
          format: talks.format,
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
        .from(talks)
        .innerJoin(speakers, eq(talks.speakerId, speakers.id))
        .innerJoin(tracks, eq(talks.trackId, tracks.id))
        .innerJoin(rooms, eq(talks.roomId, rooms.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(talks.startTime);

      return result;
    }),

  // Get all tracks (for filters)
  tracks: publicProcedure.query(async () => {
    return db.select().from(tracks);
  }),
});
