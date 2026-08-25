export type SportGroup = "team" | "racquet" | "solo";

export interface SportCategory {
  id: string;
  name: string;
  group: SportGroup;
  image: string;
  players: string;
  badge?: string;
}

export interface FeatureInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface StepInfo {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface AlgorithmInfo {
  id: string;
  title: string;
  description: string;
  formula: string;
  icon: string;
}

export interface AiCard {
  id: string;
  title: string;
  description: string;
  sample: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  sport: string;
  quote: string;
  rating: number;
  initials: string;
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export interface Match {
  id: string;
  sport: string;
  venue: string;
  distanceKm: number;
  time: string;
  slots: number;
  filled: number;
  avgElo: number;
}
