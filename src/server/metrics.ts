import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { emitEvent } from "@/lib/live";
import type { PlayerMetrics } from "@/db/schema";

export type MetricsDTO = PlayerMetrics;

export const recordMetricsFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      userId: string;
      roomId: string;
      heartRate: number;
      steps: number;
      calories: number;
      distanceM: number;
      speed: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const metric = {
      id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      roomId: data.roomId,
      heartRate: data.heartRate,
      steps: data.steps,
      calories: data.calories,
      distanceM: data.distanceM,
      speed: data.speed,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.insert(schema.playerMetrics).values(metric).run();
    emitEvent({ channel: "metrics", roomId: data.roomId });
    return metric as MetricsDTO;
  });

export const listRoomMetricsFn = createServerFn({ method: "GET" })
  .validator((d: { roomId: string }) => d)
  .handler(async ({ data }) => {
    const rows = db
      .select()
      .from(schema.playerMetrics)
      .where(eq(schema.playerMetrics.roomId, data.roomId))
      .orderBy(desc(schema.playerMetrics.recordedAt))
      .limit(100)
      .all();
    return rows as MetricsDTO[];
  });

export const listUserMetricsFn = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const rows = db
      .select()
      .from(schema.playerMetrics)
      .where(eq(schema.playerMetrics.userId, data.userId))
      .orderBy(desc(schema.playerMetrics.recordedAt))
      .limit(200)
      .all();
    return rows as MetricsDTO[];
  });
