import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { rooms, speakers, talks, tracks } from "@/lib/db/schema";
import { publicProcedure, router } from "../init";

export const speakersRouter = router({
  // Get all speakers
  list: publicProcedure.query(async () => {
    return db.select().from(speakers).orderBy(speakers.name);
  }),

  // Get single speaker by ID with their talks
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const speaker = await db.select().from(speakers).where(eq(speakers.id, input.id)).limit(1);

    if (!speaker[0]) return null;

    const speakerTalks = await db
      .select({
        id: talks.id,
        title: talks.title,
        description: talks.description,
        startTime: talks.startTime,
        endTime: talks.endTime,
        level: talks.level,
        format: talks.format,
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
      .innerJoin(tracks, eq(talks.trackId, tracks.id))
      .innerJoin(rooms, eq(talks.roomId, rooms.id))
      .where(eq(talks.speakerId, input.id))
      .orderBy(talks.startTime);

    return {
      ...speaker[0],
      talks: speakerTalks,
    };
  }),
});
