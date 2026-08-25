import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  mobileNumber: text("mobile_number"),
  passwordHash: text("password_hash").notNull(),
  city: text("city"),
  elo: integer("elo").notNull().default(1200),
  bio: text("bio"),
  fairPlay: real("fair_play").notNull().default(0),
  reliability: real("reliability").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  matchesPlayed: integer("matches_played").notNull().default(0),
  hoursOnCourt: integer("hours_on_court").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const playerAssessments = sqliteTable(
  "player_assessments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    selectedGame: text("selected_game").notNull(),
    experienceLevel: text("experience_level").notNull(),
    yearsOfExperience: text("years_of_experience").notNull(),
    playingFrequency: text("playing_frequency").notNull(),
    tournamentExperience: text("tournament_experience").notNull(),
    preferredRole: text("preferred_role"),
    preferredEvent: text("preferred_event"),
    playingStyle: text("playing_style"),
    strengths: text("strengths").notNull(),
    improvementAreas: text("improvement_areas").notNull(),
    matchesPerMonth: text("matches_per_month").notNull(),
    answers: text("answers").notNull(),
    initialSkillScore: integer("initial_skill_score").notNull(),
    initialSkillConfidence: text("initial_skill_confidence").notNull(),
    verificationType: text("verification_type").notNull(),
    hasCertificate: integer("has_certificate", { mode: "boolean" }).notNull().default(false),
    certificateImage: text("certificate_image"),
    certificatePath: text("certificate_path"),
    videoPath: text("video_path"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_assessments_user").on(table.userId)],
);

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  sport: text("sport").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  distanceKm: real("distance_km").notNull().default(0),
  time: text("time").notNull(),
  slots: integer("slots").notNull(),
  filled: integer("filled").notNull().default(1),
  avgElo: integer("avg_elo").notNull().default(1200),
  skill: text("skill").notNull(),
  host: text("host").notNull(),
  hostUserId: text("host_user_id"),
  status: text("status", { enum: ["open", "filling", "closed"] })
    .notNull()
    .default("open"),
  description: text("description"),
  lat: real("lat"),
  lng: real("lng"),
  createdAt: text("created_at").notNull(),
});

export const roomMembers = sqliteTable(
  "room_members",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    skill: text("skill").notNull(),
    joinedAt: text("joined_at").notNull(),
  },
  (table) => [
    index("idx_room_members_room").on(table.roomId),
    index("idx_room_members_user").on(table.userId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    initials: text("initials").notNull(),
    text: text("text").notNull(),
    time: text("time").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    isMe: integer("is_me", { mode: "boolean" }).notNull().default(false),
    system: integer("system", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_messages_room").on(table.roomId),
    index("idx_messages_created").on(table.createdAt),
  ],
);

export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    sport: text("sport").notNull(),
    venue: text("venue").notNull(),
    date: text("date").notNull(),
    skill: text("skill").notNull(),
    fairness: integer("fairness").notNull(),
    teammates: integer("teammates").notNull(),
    performance: integer("performance").notNull(),
    result: text("result", { enum: ["Win", "Loss", "Draw"] }).notNull(),
    comment: text("comment"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_feedback_user").on(table.userId),
    index("idx_feedback_room").on(table.roomId),
  ],
);

export const playerMetrics = sqliteTable(
  "player_metrics",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    heartRate: integer("heart_rate").notNull().default(0),
    steps: integer("steps").notNull().default(0),
    calories: real("calories").notNull().default(0),
    distanceM: real("distance_m").notNull().default(0),
    speed: real("speed").notNull().default(0),
    recordedAt: text("recorded_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_metrics_room").on(table.roomId),
    index("idx_metrics_user").on(table.userId),
  ],
);

export const eloHistory = sqliteTable(
  "elo_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sport: text("sport").notNull(),
    elo: integer("elo").notNull(),
    recordedAt: text("recorded_at").notNull(),
  },
  (table) => [
    index("idx_elo_user").on(table.userId),
    index("idx_elo_recorded").on(table.recordedAt),
  ],
);

export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
    sport: text("sport").notNull(),
    venue: text("venue").notNull(),
    date: text("date").notNull(),
    opponent: text("opponent").notNull(),
    score: text("score").notNull(),
    result: text("result", { enum: ["Win", "Loss", "Draw"] }).notNull(),
    eloAfter: integer("elo_after").notNull(),
    eloChange: integer("elo_change").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_matches_room").on(table.roomId)],
);

export type User = typeof users.$inferSelect;
export type PlayerAssessment = typeof playerAssessments.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type RoomMember = typeof roomMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type FeedbackRow = typeof feedback.$inferSelect;
export type PlayerMetrics = typeof playerMetrics.$inferSelect;
export type EloHistory = typeof eloHistory.$inferSelect;
export type Match = typeof matches.$inferSelect;
