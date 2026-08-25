import { createServerFn } from "@tanstack/react-start";
import { and, eq, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { emitEvent } from "@/lib/live";
import type { Room, RoomMember } from "@/db/schema";

export type RoomDTO = Room;

export interface RosterPlayer {
  id: string;
  name: string;
  skill: string;
  elo: number;
  isMe?: boolean | undefined;
}

export const listRoomRostersFn = createServerFn({ method: "GET" })
  .validator((d: { roomId: string }) => d)
  .handler(async ({ data }) => {
    const members = db
      .select()
      .from(schema.roomMembers)
      .where(eq(schema.roomMembers.roomId, data.roomId))
      .all();

    const roster: RosterPlayer[] = members.map((m) => {
      const u = m.userId
        ? db.select().from(schema.users).where(eq(schema.users.id, m.userId)).get()
        : undefined;
      return {
        id: m.userId ?? m.id,
        name: m.name,
        skill: m.skill,
        elo: u?.elo ?? 1200,
      };
    });

    return roster;
  });

export const listRoomsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = db.select().from(schema.rooms).orderBy(desc(schema.rooms.createdAt)).all();
  return rows as RoomDTO[];
});

export const getRoomFn = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const row = db.select().from(schema.rooms).where(eq(schema.rooms.id, data.id)).get();
    return (row as RoomDTO | undefined) ?? null;
  });

export const createRoomFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      sport: string;
      venue: string;
      city: string;
      distanceKm: number;
      time: string;
      slots: number;
      skill: string;
      host: string;
      hostUserId?: string | undefined;
      description?: string | undefined;
      lat?: number | null | undefined;
      lng?: number | null | undefined;
    }) => d,
  )
  .handler(async ({ data }) => {
    const room = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...data,
      hostUserId: data.hostUserId ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      filled: 1,
      avgElo: 1200,
      status: "open" as const,
      createdAt: new Date().toISOString(),
    };
    db.insert(schema.rooms).values(room).run();
    db.insert(schema.roomMembers)
      .values({
        id: `rm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        roomId: room.id,
        userId: data.hostUserId ?? null,
        name: data.host,
        skill: data.skill,
        joinedAt: room.createdAt,
      })
      .run();
    emitEvent({ channel: "rooms", roomId: room.id });
    return room as unknown as RoomDTO;
  });

export const joinRoomFn = createServerFn({ method: "POST" })
  .validator((d: { roomId: string; name: string; skill: string; userId?: string | undefined }) => d)
  .handler(async ({ data }) => {
    const room = db.select().from(schema.rooms).where(eq(schema.rooms.id, data.roomId)).get();

    if (!room) throw new Error("Room not found");
    if (room.status === "closed" || room.filled >= room.slots) {
      return { ok: false, message: "This room is already full or locked." };
    }

    if (data.userId) {
      const existing = db
        .select({ id: schema.roomMembers.id })
        .from(schema.roomMembers)
        .where(
          and(eq(schema.roomMembers.roomId, room.id), eq(schema.roomMembers.userId, data.userId)),
        )
        .get();
      if (existing || room.hostUserId === data.userId) {
        return { ok: false, message: "You have already joined this room." };
      }
    }

    const now = new Date().toISOString();
    db.insert(schema.roomMembers)
      .values({
        id: `rm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        roomId: room.id,
        userId: data.userId ?? null,
        name: data.name,
        skill: data.skill,
        joinedAt: now,
      })
      .run();

    const newFilled = room.filled + 1;
    db.update(schema.rooms)
      .set({
        filled: newFilled,
        status: newFilled >= room.slots ? ("closed" as const) : room.status,
      })
      .where(eq(schema.rooms.id, room.id))
      .run();

    // System message in room chat
    db.insert(schema.messages)
      .values({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        roomId: room.id,
        author: "NexSport",
        initials: "N",
        text: `${data.name} joined as ${data.skill}.`,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        userId: data.userId ?? null,
        isMe: false,
        system: true,
        createdAt: now,
      })
      .run();

    emitEvent({ channel: "rooms", roomId: room.id });
    emitEvent({ channel: "messages", roomId: room.id });
    return { ok: true, room: { ...room, filled: newFilled } as RoomDTO };
  });
