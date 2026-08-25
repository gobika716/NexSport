import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Lightweight real-time sync bridge.
 *
 * Server functions call `emitEvent(channel, payload)` after a mutation. The
 * browser connects to `/api/live` (Server-Sent Events) via `useLiveRefresh`
 * and maps each event to the matching TanStack Query key so the UI refreshes
 * without a manual refetch.
 */

export type LiveEvent =
  | { channel: "rooms"; roomId?: string }
  | { channel: "messages"; roomId: string }
  | { channel: "metrics"; roomId: string }
  | { channel: "feedback"; userId?: string }
  | { channel: "leaderboard"; sport?: string }
  | { channel: "analytics"; userId?: string };

const listeners = new Set<(e: LiveEvent) => void>();

/** Called by server functions after any DB mutation that should go live. */
export function emitEvent(event: LiveEvent) {
  listeners.forEach((cb) => cb(event));
}

/** Server-only: registers a listener (used by the SSE endpoint). */
export function subscribeLive(cb: (e: LiveEvent) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function queryKeyFor(event: LiveEvent): unknown[] {
  switch (event.channel) {
    case "rooms":
      return ["rooms"];
    case "messages":
      return ["messages", event.roomId];
    case "metrics":
      return ["metrics", event.roomId];
    case "feedback":
      return event.userId ? ["feedback", event.userId] : ["feedback"];
    case "leaderboard":
      return ["leaderboard"];
    case "analytics":
      return event.userId ? ["analytics", event.userId] : ["analytics"];
  }
}

/**
 * React hook: opens an SSE stream to /api/live and invalidates the relevant
 * TanStack Query keys whenever the server broadcasts a mutation.
 */
export function useLiveRefresh(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const es = new EventSource("/api/live");
    es.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as LiveEvent;
        const key = queryKeyFor(event);
        void queryClient.invalidateQueries({ queryKey: key });
      } catch {
        /* ignore malformed frames */
      }
    };
    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do here.
    };

    return () => es.close();
  }, [enabled, queryClient]);
}
