import { createServerFn } from "@tanstack/react-start";
import { and, eq, asc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { emitEvent } from "@/lib/live";
import type { Message } from "@/db/schema";

export type MessageDTO = Message;

export const listMessagesFn = createServerFn({ method: "GET" })
  .validator((d: { roomId: string; userId?: string | undefined }) => d)
  .handler(async ({ data }) => {
    const rows = db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.roomId, data.roomId))
      .orderBy(asc(schema.messages.createdAt))
      .all();
    return rows.map((message) => ({
      ...message,
      isMe: Boolean(data.userId && message.userId === data.userId && !message.system),
    })) as MessageDTO[];
  });

export const sendMessageFn = createServerFn({ method: "POST" })
  .validator((d: { roomId: string; author: string; text: string; userId: string }) => d)
  .handler(async ({ data }) => {
    const room = db.select().from(schema.rooms).where(eq(schema.rooms.id, data.roomId)).get();
    if (!room) throw new Error("Room not found");

    const isHost = room.hostUserId === data.userId;
    const isMember = Boolean(
      db
        .select({ id: schema.roomMembers.id })
        .from(schema.roomMembers)
        .where(
          and(
            eq(schema.roomMembers.roomId, data.roomId),
            eq(schema.roomMembers.userId, data.userId),
          ),
        )
        .get(),
    );

    if (!isHost && !isMember) {
      throw new Error("Only players in this room can send messages.");
    }

    const text = data.text.trim();
    if (!text) throw new Error("Message cannot be empty.");

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: data.roomId,
      author: data.author,
      initials: data.author
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      text,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      userId: data.userId,
      isMe: true,
      system: false,
      createdAt: new Date().toISOString(),
    };
    db.insert(schema.messages).values(msg).run();
    emitEvent({ channel: "messages", roomId: data.roomId });
    return msg as MessageDTO;
  });
