import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { emitEvent } from "@/lib/live";
import type { Match } from "@/db/schema";

export type MatchDTO = Match;

/**
 * Record a completed match, update the user's Elo, and store an Elo snapshot.
 * Uses the standard Elo formula: R' = R + K * (S - E)
 * where E = 1 / (1 + 10^((R_opp - R)/400)) and S is 1 for win, 0.5 draw, 0 loss.
 */
export const recordMatchFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      roomId?: string | undefined;
      userId: string;
      sport: string;
      venue: string;
      date?: string | undefined;
      opponent: string;
      opponentElo: number;
      score: string;
      result: "Win" | "Loss" | "Draw";
    }) => d,
  )
  .handler(async ({ data }) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, data.userId)).get();

    if (!user) throw new Error("User not found");

    const K = 32;
    const R = user.elo;
    const Ro = data.opponentElo;
    const E = 1 / (1 + Math.pow(10, (Ro - R) / 400));
    const S = data.result === "Win" ? 1 : data.result === "Draw" ? 0.5 : 0;
    const eloChange = Math.round(K * (S - E));
    const newElo = Math.max(100, R + eloChange);

    const now = new Date().toISOString();
    const matchDate = data.date ?? now;

    const match = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: data.roomId ?? null,
      sport: data.sport,
      venue: data.venue,
      date: matchDate,
      opponent: data.opponent,
      score: data.score,
      result: data.result,
      eloAfter: newElo,
      eloChange,
      createdAt: now,
    };

    db.insert(schema.matches).values(match).run();

    // Update user Elo + match count + streak
    const newStreak =
      data.result === "Win" ? user.streak + 1 : data.result === "Loss" ? 0 : user.streak;
    db.update(schema.users)
      .set({
        elo: newElo,
        matchesPlayed: user.matchesPlayed + 1,
        streak: newStreak,
      })
      .where(eq(schema.users.id, data.userId))
      .run();

    // Store Elo history snapshot
    db.insert(schema.eloHistory)
      .values({
        id: `eh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: data.userId,
        sport: data.sport,
        elo: newElo,
        recordedAt: now,
      })
      .run();

    emitEvent({ channel: "analytics", userId: data.userId });
    emitEvent({ channel: "leaderboard", sport: data.sport });
    return { ok: true, match: match as MatchDTO, newElo, eloChange };
  });

export const listMatchesFn = createServerFn({ method: "GET" })
  .validator((d: { userId?: string | undefined }) => d)
  .handler(async ({ data }) => {
    const rows = data.userId
      ? db
          .select()
          .from(schema.matches)
          .all()
          .filter((m) => m.opponent === data.userId)
      : db.select().from(schema.matches).all();
    return rows as MatchDTO[];
  });
