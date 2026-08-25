import { useEffect, useSyncExternalStore } from "react";
import { mockRooms, type MatchRoom } from "@/data/roomData";
import { mockChat, type ChatMessage } from "@/data/chatData";

export interface MatchFeedback {
  id: string;
  roomId: string;
  sport: string;
  venue: string;
  date: string;
  skill: string;
  fairness: number;
  teammates: number;
  performance: number;
  result: "Win" | "Loss" | "Draw";
  comment: string;
}

interface StoreState {
  rooms: MatchRoom[];
  joined: { roomId: string; skill: string }[];
  feedback: MatchFeedback[];
  messages: ChatMessage[];
}

const STORAGE_KEY = "nexsport:mock-store";

let state: StoreState = {
  rooms: mockRooms,
  joined: [],
  feedback: [],
  messages: mockChat,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        joined: state.joined,
        feedback: state.feedback,
        messages: state.messages.filter((m) => m.isMe),
      }),
    );
  } catch {
    /* storage unavailable — mock data only */
  }
}

function setState(next: Partial<StoreState>) {
  state = { ...state, ...next };
  emit();
  persist();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;

export function useMockStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.feedback.length || state.joined.length) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      setState({
        joined: parsed.joined ?? [],
        feedback: parsed.feedback ?? [],
        messages: [...mockChat, ...(parsed.messages ?? [])],
      });
    } catch {
      /* ignore malformed cache */
    }
  }, []);

  return snap;
}

export function getRoom(id: string) {
  return state.rooms.find((r) => r.id === id);
}

export function addRoom(room: MatchRoom) {
  setState({ rooms: [room, ...state.rooms] });
}

export function isJoined(roomId: string) {
  return state.joined.some((j) => j.roomId === roomId);
}

export function joinRoom(roomId: string, skill: string) {
  if (isJoined(roomId)) return;
  setState({
    joined: [...state.joined, { roomId, skill }],
    rooms: state.rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            filled: Math.min(r.filled + 1, r.slots),
            status: r.filled + 1 >= r.slots ? "closed" : r.status,
          }
        : r,
    ),
  });
}

export function addFeedback(entry: Omit<MatchFeedback, "id" | "date">) {
  const item: MatchFeedback = {
    ...entry,
    id: `fb-${Date.now()}`,
    date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" }),
  };
  setState({ feedback: [item, ...state.feedback] });
}

export function messagesFor(roomId: string) {
  return state.messages.filter((m) => m.roomId === roomId);
}

export function sendMessage(roomId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const item: ChatMessage = {
    id: `msg-${Date.now()}`,
    roomId,
    author: "You",
    initials: "YO",
    text: trimmed,
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    isMe: true,
  };
  setState({ messages: [...state.messages, item] });
}
