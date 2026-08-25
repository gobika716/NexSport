# NexSport Real-Time Refactor — TODO

Goal: Remove all mock/static data, make everything real-time DB-driven with IoT (GPS + Bluetooth) integration. Retain demo login.

## Phase 1 — Schema upgrades

- [x] Add `lat`, `lng` columns to `rooms` (real GPS venue coords)
- [x] Add `player_metrics` table (heart-rate, steps, calories, distance, speed, timestamp)
- [x] Add `elo_history` table (Elo snapshots over time)
- [x] Add `matches` table (completed match results + scores)
- [x] Generate + apply migration

## Phase 2 — Server functions

- [x] Upgrade `rooms.ts`: accept real GPS lat/lng, real rosters from `room_members`
- [x] Add `analytics.ts`: real dashboard stats (Elo trend, win rate, sport split, match history, skill radar)
- [x] Add `leaderboardFn`: real rankings from `users.elo` + `matches`
- [x] Add `metricsFn`: record/query heart-rate & activity (Web Bluetooth)
- [x] Add `matchesFn`: record/complete matches, update Elo
- [x] Update `auth.ts`: expose per-sport Elo / real profile

## Phase 3 — Hooks (IoT)

- [x] Add `useGeolocation()` hook (real GPS)
- [x] Add `useHeartRate()` hook (Web Bluetooth BLE)

## Phase 4 — Real-time sync

- [x] Add SSE/WebSocket bridge for chat + rooms + metrics live updates
- [x] `emitEvent` wired into rooms, chat, metrics, feedback, matches
- [x] `useLiveRefresh` hook + `/api/live` SSE endpoint

## Phase 5 — UI updates (replace mock consumers)

- [x] Dashboard: real charts from `analytics.ts`; real AI Coach from analytics
- [x] Leaderboard: real rankings from `getLeaderboardFn`
- [x] Profile: real user + stats + badges from analytics + rooms
- [x] Room details: real rosters + live heart-rate widget (`LiveHeartRate`)
- [x] Rooms list: real distance via Haversine + live refresh

## Phase 6 — Seed cleanup

- [x] Replace `seed.ts` with demo-user-only (remove static rooms/chat)
- [x] Remove/stop using mock data files for interactive features

## Phase 8 — AI Assistant

- [x] Add NexSport AI assistant chatbot (app Q&A + AI Coach insights)

## Phase 7 — Verify

- [x] Run migrations, restart dev, test all flows
- [x] Confirm demo login works
