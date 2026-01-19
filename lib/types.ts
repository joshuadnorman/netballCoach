/**
 * Data types for the Netball Coach Planner app
 * Updated with MENLO specifications
 */

// Updated drill categories per MENLO spec
export const DRILL_CATEGORIES = [
  "Centre Pass Defence",
  "Defence",
  "Attack",
  "Shooting",
  "Transition",
  "Conditioning",
  "Warm-up",
] as const;

export type DrillCategory = (typeof DRILL_CATEGORIES)[number];

// Legacy categories for week planning
export const CATEGORIES = [
  "TOURNAMENT",
  "GAME",
  "THROW IN",
  "CENTRE PASS",
  "DEFENSE (FULL)",
  "DEFENSE (A 1/3)",
  "DEFENSE (C 1/3)",
  "DEFENSE (D 1/3)",
  "ATTACK (FULL)",
  "ATTACK (A 1/3)",
  "ATTACK (C 1/3)",
  "ATTACK (D 1/3)",
  "SHOOTING",
  "AGILITY",
  "SSG",
  "BALL PLACEMENT",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Category colors for visual distinction
export const CATEGORY_COLORS: Record<DrillCategory, string> = {
  "Centre Pass Defence": "#6EC6FF",
  "Defence": "#8B7CFF",
  "Attack": "#FF5DA2",
  "Shooting": "#22C55E",
  "Transition": "#F59E0B",
  "Conditioning": "#3B82F6",
  "Warm-up": "#0A1F44",
};

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  size: number;
  color?: string;
}

export interface Cone {
  id?: string;
  x: number;
  y: number;
  color: "red" | "blue" | "yellow" | string;
}

export interface DrillDiagram {
  strokes: Stroke[];
  cones: Cone[];
}

export interface Drill {
  id: string;
  name: string;
  category: Category | DrillCategory | string;
  description: string;
  diagram: DrillDiagram;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  usageCount?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface SessionBlock {
  id: string;
  category: Category | DrillCategory | string;
  drillId: string;
  minutes: number;
  notes?: string;
}

export interface Session {
  id: string;
  dateISO?: string;
  date?: string;
  title?: string;
  blocks?: SessionBlock[];
  drills?: SessionDrill[];
  totalMinutes: number;
  durationMinutes?: number;
  focusAreas?: string[];
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface DayCategoryPlan {
  minutes: number;
  achieved: boolean;
  notes: string;
}

export interface DayPlan {
  categories: Record<string, DayCategoryPlan>;
  notes: string;
}

export interface WeekPlan {
  [dateISO: string]: DayPlan;
}

export type EventType = "game" | "tournament" | "birthday" | "test" | "coaching";

export interface SeasonEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  time?: string;
  description?: string;
  notes?: string;
  color?: string;
  linkedPlayerId?: string;
}

// Stats calculation output
export interface StatsOutput {
  range: "week" | "month" | "year";
  rangeKey: string;
  totals: {
    trainingSessions: number;
    games: number;
    tournaments: number;
    tournamentDays: number;
    totalMinutes: number;
    avgMinutesPerSession: number;
  };
  minutesByCategory: Record<string, number>;
  topDrillsByCount: Array<{
    drillId: string;
    name: string;
    count: number;
    minutes: number;
  }>;
  leaders: {
    topCategory: string;
    mostUsedDrill: string;
  };
}

// Team data
export interface Team {
  id: string;
  name: string;
  color: string;
}

// Legacy types for backward compatibility
export type FocusArea = Category;
export const FOCUS_AREAS = CATEGORIES;

export interface DayFocusArea {
  area: FocusArea;
  achieved: boolean;
  timeSpent: number;
}

export interface LegacyDayPlan {
  date: string;
  focusAreas: DayFocusArea[];
  notes: string;
}

export interface LegacyWeekPlan {
  id: string;
  weekStart: string;
  days: LegacyDayPlan[];
}

export interface SessionDrill {
  drillId: string;
  duration: number;
  order: number;
  plannedMinutes?: number;
  completedMinutes?: number;
}

export interface LegacySession {
  id: string;
  date: string;
  drills: SessionDrill[];
  totalDuration: number;
}
