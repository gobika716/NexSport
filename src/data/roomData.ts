export interface MatchRoom {
  id: string;
  sport: string;
  venue: string;
  city: string;
  distanceKm: number;
  time: string;
  slots: number;
  filled: number;
  avgElo: number;
  skill: string;
  host: string;
  status: "open" | "filling" | "closed";
  description?: string | null;
  hostUserId?: string | null;
  createdAt?: string;
}

export const mockRooms: MatchRoom[] = [
  {
    id: "r1",
    sport: "Badminton",
    venue: "Sunrise Sports Arena",
    city: "Bengaluru",
    distanceKm: 1.4,
    time: "Today, 7:00 PM",
    slots: 4,
    filled: 3,
    avgElo: 1180,
    skill: "Intermediate",
    host: "Aarav Menon",
    status: "filling",
    description: "Doubles, two courts booked. Bring your own shuttles.",
  },
  {
    id: "r2",
    sport: "Football",
    venue: "Greenfield Turf",
    city: "Bengaluru",
    distanceKm: 3.2,
    time: "Tomorrow, 6:30 AM",
    slots: 14,
    filled: 11,
    avgElo: 1245,
    skill: "Open (all levels)",
    host: "Marco Silva",
    status: "filling",
    description: "7-a-side, teams balanced automatically at kickoff.",
  },
  {
    id: "r3",
    sport: "Cricket",
    venue: "City Oval Ground",
    city: "Mumbai",
    distanceKm: 5.8,
    time: "Sat, 8:00 AM",
    slots: 22,
    filled: 16,
    avgElo: 1310,
    skill: "Advanced",
    host: "Vikram Joshi",
    status: "open",
    description: "16 overs a side, hard ball. Umpire arranged.",
  },
  {
    id: "r4",
    sport: "Tennis",
    venue: "Riverside Courts",
    city: "Chennai",
    distanceKm: 2.1,
    time: "Sun, 5:30 PM",
    slots: 4,
    filled: 4,
    avgElo: 1420,
    skill: "Advanced",
    host: "Grace Lim",
    status: "closed",
    description: "Room locked — teams already generated.",
  },
  {
    id: "r5",
    sport: "Basketball",
    venue: "Northside Court",
    city: "Delhi",
    distanceKm: 4.6,
    time: "Fri, 8:00 PM",
    slots: 10,
    filled: 5,
    avgElo: 1198,
    skill: "Beginner",
    host: "Jamal Reed",
    status: "open",
    description: "Casual 5v5 under lights, newcomers welcome.",
  },
];
