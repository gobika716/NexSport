import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { emitEvent } from "@/lib/live";
import type { FeedbackRow } from "@/db/schema";

export type FeedbackDTO = FeedbackRow;

export const listFeedbackFn = createServerFn({ method: "GET" })
  .validator((d: { userId?: string | undefined }) => d)
  .handler(async ({ data }) => {
    const rows = data.userId
      ? db
          .select()
          .from(schema.feedback)
          .where(eq(schema.feedback.userId, data.userId))
          .orderBy(desc(schema.feedback.createdAt))
          .all()
      : db.select().from(schema.feedback).orderBy(desc(schema.feedback.createdAt)).all();
    return rows as FeedbackDTO[];
  });

export const addFeedbackFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      roomId: string;
      userId?: string | undefined;
      sport: string;
      venue: string;
      date: string;
      skill: string;
      fairness: number;
      teammates: number;
      performance: number;
      result: "Win" | "Loss" | "Draw";
      comment?: string | undefined;
    }) => d,
  )
  .handler(async ({ data }) => {
    const fb = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: data.roomId,
      userId: data.userId ?? null,
      sport: data.sport,
      venue: data.venue,
      date: data.date,
      skill: data.skill,
      fairness: data.fairness,
      teammates: data.teammates,
      performance: data.performance,
      result: data.result,
      comment: data.comment ?? null,
      createdAt: new Date().toISOString(),
    };
    db.insert(schema.feedback).values(fb).run();
    emitEvent(fb.userId ? { channel: "feedback", userId: fb.userId } : { channel: "feedback" });
    return fb as FeedbackDTO;
  });
