import type { Match } from "@/types";

export const mockMatches: Match[] = [
  {
    id: "m1",
    sport: "Badminton",
    venue: "Sunrise Sports Arena",
    distanceKm: 1.4,
    time: "Today, 7:00 PM",
    slots: 4,
    filled: 3,
    avgElo: 1180,
  },
  {
    id: "m2",
    sport: "Football",
    venue: "Greenfield Turf",
    distanceKm: 3.2,
    time: "Tomorrow, 6:30 AM",
    slots: 14,
    filled: 11,
    avgElo: 1245,
  },
  {
    id: "m3",
    sport: "Cricket",
    venue: "City Oval Ground",
    distanceKm: 5.8,
    time: "Sat, 8:00 AM",
    slots: 22,
    filled: 16,
    avgElo: 1310,
  },
];

export const matchSports = [
  "Cricket",
  "Football",
  "Badminton",
  "Basketball",
  "Volleyball",
  "Tennis",
  "Table Tennis",
  "Kabaddi",
  "Hockey",
  "Chess",
];

export const skillBands = ["Beginner", "Intermediate", "Advanced", "Open (all levels)"];
