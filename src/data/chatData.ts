export interface ChatMessage {
  id: string;
  roomId: string;
  author: string;
  initials: string;
  text: string;
  time: string;
  isMe?: boolean;
  system?: boolean;
  userId?: string | null;
  createdAt?: string | null;
}

function msg(
  roomId: string,
  author: string,
  text: string,
  time: string,
  extra: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: `${roomId}-${author}-${time}-${text.length}`,
    roomId,
    author,
    initials: author
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    text,
    time,
    ...extra,
  };
}

export const mockChat: ChatMessage[] = [
  msg("r1", "NexSport", "Room created · teams will be auto-balanced at lock-in.", "6:02 PM", {
    system: true,
  }),
  msg("r1", "Aarav Menon", "Courts 3 and 4 are booked from 7. Please be there by 6:50.", "6:05 PM"),
  msg("r1", "Nikita Rao", "Carrying two tubes of shuttles 🏸", "6:11 PM"),
  msg("r1", "Devin Carter", "Parking is free after 6, use the back gate.", "6:24 PM"),

  msg("r2", "NexSport", "11 of 14 spots filled — 3 left.", "9:00 PM", { system: true }),
  msg("r2", "Marco Silva", "Bring both a light and a dark shirt, bibs are limited.", "9:04 PM"),
  msg("r2", "Sana Iqbal", "Can someone bring a spare ball? Mine is flat.", "9:18 PM"),
  msg("r2", "Rohit Bansal", "I've got two, all sorted 👍", "9:20 PM"),

  msg("r3", "NexSport", "Match locked — zig-zag teams published.", "7:30 PM", { system: true }),
  msg("r3", "Vikram Joshi", "Toss at 7:55 sharp, whites preferred.", "7:35 PM"),
  msg("r3", "Grace Lim", "Scorer app is on me this week.", "7:48 PM"),

  msg("r4", "NexSport", "Room open · singles ladder format.", "5:10 PM", { system: true }),
  msg("r4", "Grace Lim", "Court 2 has better lighting for evening play.", "5:22 PM"),

  msg("r5", "NexSport", "Room open · 5-a-side half court.", "4:00 PM", { system: true }),
  msg("r5", "Tomas Reyes", "Nets were replaced last week, they look great.", "4:31 PM"),
];

export const quickReplies = [
  "On my way 🏃",
  "Running 10 mins late",
  "Who's bringing the gear?",
  "Count me in for next week",
];
