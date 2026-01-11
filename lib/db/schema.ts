import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Speakers table
export const speakers = sqliteTable("speakers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  avatar: text("avatar").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  twitter: text("twitter"),
});

// Tracks table (Performance, AI, Full Stack, etc.)
export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(), // hex color
  description: text("description").notNull(),
});

// Rooms table
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
});

// Talks table
export const talks = sqliteTable("talks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  speakerId: text("speaker_id")
    .notNull()
    .references(() => speakers.id),
  trackId: text("track_id")
    .notNull()
    .references(() => tracks.id),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id),
  startTime: integer("start_time").notNull(), // unix timestamp
  endTime: integer("end_time").notNull(), // unix timestamp
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  format: text("format", { enum: ["talk", "workshop", "keynote", "panel"] }).notNull(),
});

// Users table (conference attendees)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(), // hashed
  createdAt: integer("created_at").notNull(),
});

// User schedules (many-to-many: users <-> talks)
export const userSchedules = sqliteTable("user_schedules", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  talkId: text("talk_id")
    .notNull()
    .references(() => talks.id),
  addedAt: integer("added_at").notNull(),
});

// Ratings table
export const ratings = sqliteTable("ratings", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  talkId: text("talk_id")
    .notNull()
    .references(() => talks.id),
  score: integer("score").notNull(), // 1-5
  comment: text("comment"),
  createdAt: integer("created_at").notNull(),
});

// Type exports
export type Speaker = typeof speakers.$inferSelect;
export type NewSpeaker = typeof speakers.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Talk = typeof talks.$inferSelect;
export type NewTalk = typeof talks.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSchedule = typeof userSchedules.$inferSelect;
export type NewUserSchedule = typeof userSchedules.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
