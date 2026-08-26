# PRD v2 — Match Room Venue Selection & Travel ETA (supersedes v1)

**Repo:** `gobika716/NexSport` · **Stack:** TanStack Start + React 19 + Drizzle/better-sqlite3
**Status:** Draft for review — replaces `NexSport-Venue-Dropdown-ETA-PRD.md`

**What changed from v1, and why:**

1. Venue list is no longer "seed a few example rows" — it's the **41-venue Erode master list** you supplied, with an explicit verified/unverified data-quality gate so we never show a venue with a fabricated coordinate.
2. Venue picker is a **searchable autocomplete**, not a plain `<select>`.
3. Travel time is now computed by a **real routing/directions API**, not Haversine+heuristic — Haversine straight-line distance is _not_ a driving-time estimate, and v1 was wrong to treat it as one.
4. I re-checked the DB against the claim that `creator_lat`/`creator_lng`/`spot_lat`/`spot_lng`/`spot_address` already exist — **this is half-true, and the exact nature of the gap matters**, detailed in §4.1.

---

## 1. Verifying the "already exists" claim — exact finding

I re-inspected both the Drizzle schema and the raw migration files:

```
$ cat drizzle/0006_skinny_multiple_man.sql
ALTER TABLE `rooms` ADD `creator_lat` real;
ALTER TABLE `rooms` ADD `creator_lng` real;
ALTER TABLE `rooms` ADD `spot_lat` real;
ALTER TABLE `rooms` ADD `spot_lng` real;
ALTER TABLE `rooms` ADD `spot_address` text;

```

```
$ sed -n '/export const rooms/,/^});/p' src/db/schema.ts
export const rooms = sqliteTable("rooms", {
  id, sport, venue, city, distanceKm, time, slots, filled,
  avgElo, skill, host, hostUserId, status, description,
  lat, lng, createdAt,
  // creator_lat / creator_lng / spot_lat / spot_lng / spot_address
  // are NOT declared here
});

```

**So: migration** **`0006`** **physically added those 5 columns to the SQLite file, but** **`src/db/schema.ts`** **— the file Drizzle actually reads to know what columns exist — never picked them up.** This is schema drift, not a usable feature. Two consequences:

- Today, `db.select().from(schema.rooms)` **cannot read or write those columns at all** — Drizzle doesn't know they exist. They are dead columns sitting unused in the physical DB.
- If anyone runs `npm run db:generate` right now, drizzle-kit will diff `schema.ts` against the migration history and — because `schema.ts` doesn't have those 5 columns — will generate a **DROP COLUMN** migration for all five, silently deleting them the next time `db:migrate` runs.

This PRD's schema plan (§4) fixes the drift by declaring these 5 columns in `schema.ts` with the exact same names/types migration `0006` already used, so `drizzle-kit generate` sees no diff for them and produces a clean, additive-only migration for the genuinely new stuff (the `venues` table, `rooms.venue_id`, and the travel-estimate columns). No previously-applied migration is edited or reverted.

---

## 2. Corrected architecture decision: routing API, not Haversine

Agreed and adopted: Haversine gives straight-line distance, which systematically understates real travel time (rivers, one-way streets, highway detours). For a feature whose entire point is an accurate ETA, that's the wrong tool.

### 2.1 Provider recommendation

| Option Requires billing card Free tier Notes |        |                                           |                                                                                                                                                                                |
| -------------------------------------------- | ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Google Routes API                            | Yes    | Limited, card required even for free tier | Best accuracy, but adds a hard new operational dependency (billing account) to a project that has none today                                                                   |
| Mapbox Directions                            | Yes    | 100k free calls/mo                        | Similar friction to Google                                                                                                                                                     |
| **OpenRouteService (ORS)**                   | **No** | 2,000 req/day free, signup-only API key   | No credit card, no billing account — matches this project's current "no paid infra" posture; supports `driving-car`, `foot-walking`, `cycling-regular` profiles out of the box |
| HERE Routing                                 | Yes    | Free tier available, card required        | More enterprise-oriented                                                                                                                                                       |

**Recommendation: OpenRouteService for MVP.** It's the only option that doesn't require adding a billing relationship to a project that currently has zero paid dependencies (no email provider, no maps SDK, no analytics vendor). If NexSport later needs traffic-aware, minute-perfect ETAs, migrating to Google Routes is a contained swap behind the abstraction in §6.2 — the routing call is isolated to one function, not spread through the UI.

New env var: `ORS_API_KEY` (server-side only — **never sent to the client**, unlike the earlier v1 design where the ETA math ran entirely in the browser).

### 2.2 Fallback behavior when routing fails

Per your doc's §19/§21: routing failures must never block room creation, and a failed/unavailable routing call must be **visibly labeled as degraded**, not silently presented as a real ETA. Concretely:

- Primary: call ORS. Show `"21 min · 7.4 km"` with no extra caveat — this is the real routed number.
- If ORS times out / errors / rate-limits: fall back to `haversineKm() × 1.3` ÷ average speed (same math as v1's `travel-eta.ts`, kept as the _fallback only_, not the primary path) and show `"~24 min · 7.4 km (estimated, live traffic data unavailable)"` — visually distinct (muted color, no route icon) from the real routed chip.
- If neither origin nor destination coordinates are available: no ETA shown at all, room creation proceeds unaffected.

---

## 3. Venue master data — the 41-venue list

### 3.1 Verification gate (per your instruction: don't fabricate coordinates)

Every venue row carries two independent booleans:

```
address_verified: boolean      -- the postal address text is confirmed real (has a citable source)
coordinates_verified: boolean  -- lat/lng have been geocoded/pin-verified, not guessed

```

**A venue is only eligible to appear in the Create Room dropdown when** **`coordinates_verified = true`****.** Address-only rows (`address_verified = true`, `coordinates_verified = false`) exist in the table for data-entry completeness but are filtered out of `searchVenuesFn` results until someone geocodes them. This directly implements your "only venues with valid coordinates should appear in the dropdown" requirement.

**I have not invented latitude/longitude values for this PRD.** Geocoding the 13 addressed venues (running their verified street addresses through a geocoder or manually pin-dropping them) is called out as an explicit engineering task in §8 — not something to fabricate at spec time, consistent with your instruction.

### 3.2 Seed content — three tiers, from the list you provided

| Tier Count Seed behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |     |                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — usable location evidence** (The Colosseum Sports - Bhavani, Turf Play 365, Nilgiris Indoor Shuttle Stadium, Nilgiris Sports Club, Let's Play Turf Erode, Playzo 33, Ero Sports Zone, Samudra Sports Centre, Choliees Sports, Vilvam Sports Turf, Arena 719, Sixerr 360, Tiki Taca Turf Erode)                                                                                                                                                                                                                                                                                                                                                                    | 13  | Seeded with `address`, `address_verified: true`. `lat`/`lng` left `null`, `coordinates_verified: false` **until the geocoding pass (§8) runs** — at that point they flip to `true` and become visible in the picker.   |
| **B — address needs verification** (Feather Touch Sportz Academy, Akila Sports Arena, QG Turf, Sadur Badminton Academy, Young India Sports Arena, OMG Turf, Athappan Badminton Centre, Ero Sports Academy, Cricket Palayam Oval Turf, The Box Multisport Turf, Qube Sportz Arena, Sports Village, Tom & Jerry Sports Arena, Hifi Sports Arena, Galactic Sportz Turf, Thindal Badminton Academy, Eleven's Turf, Turfi 33, Let's Play Sports Turf - 34, Greenfield Turf, Akaran Native Sports, Play On Turf, Friends Club Indoor Shuttle Court, Majestic Sports Academy, The Turf Station, MS Sports Academy, Sportz Vibe Multisport Turf, Amman Indoor Badminton Court) | 28  | Seeded with `name` + best-known `locality`/`city` only, `address_verified: false`, `coordinates_verified: false`. Excluded from the dropdown entirely. Exists as a worklist for whoever owns venue data going forward. |
| **C — Bengaluru/Mumbai placeholders from v1**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | \~6 | **Dropped.** They weren't part of your real venue list and shouldn't be seeded alongside verified Erode data — mixing fabricated example rows with real venues defeats the point of the verification gate.             |

### 3.3 `venues` table — final field list

```ts
export const venues = sqliteTable(
  "venues",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address"),
    locality: text("locality"),
    city: text("city").notNull(),
    district: text("district"),
    state: text("state"),
    pincode: text("pincode"),
    lat: real("lat"), // nullable — see verification gate
    lng: real("lng"), // nullable — see verification gate
    sports: text("sports").notNull(), // JSON array, same convention as playerAssessments
    providerPlaceId: text("provider_place_id"), // optional, for future Places-API cross-reference
    addressVerified: integer("address_verified", { mode: "boolean" }).notNull().default(false),
    coordinatesVerified: integer("coordinates_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_venues_city").on(table.city),
    index("idx_venues_coords_verified").on(table.coordinatesVerified),
  ],
);
```

`searchVenuesFn` (§6.1) filters on `isActive = true AND coordinatesVerified = true` — `isActive` gives an operational kill-switch (e.g., a venue permanently closes) independent of the data-quality flag.

---

## 4. Data model — full migration plan

### 4.1 Fix the drift (zero new SQL, `schema.ts` only)

Add the 5 columns to `rooms` in `src/db/schema.ts`, matching migration `0006` exactly:

```ts
creatorLat: real("creator_lat"),
creatorLng: real("creator_lng"),
spotLat: real("spot_lat"),
spotLng: real("spot_lng"),
spotAddress: text("spot_address"),

```

Running `npm run db:generate` after this change should produce **no SQL** for these 5 (they already exist in the applied migration history) — that's the verification that the drift is fixed correctly. If drizzle-kit proposes anything for these columns, stop and re-check types/nullability against `0006` before proceeding.

### 4.2 New columns/table — genuinely new migration

`drizzle/0007_venues_master.sql`:

```sql
CREATE TABLE `venues` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `address` text,
  `locality` text,
  `city` text NOT NULL,
  `district` text,
  `state` text,
  `pincode` text,
  `lat` real,
  `lng` real,
  `sports` text NOT NULL,
  `provider_place_id` text,
  `address_verified` integer DEFAULT false NOT NULL,
  `coordinates_verified` integer DEFAULT false NOT NULL,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);--> statement-breakpoint
CREATE INDEX `idx_venues_city` ON `venues` (`city`);--> statement-breakpoint
CREATE INDEX `idx_venues_coords_verified` ON `venues` (`coordinates_verified`);--> statement-breakpoint
ALTER TABLE `rooms` ADD `venue_id` text REFERENCES `venues`(`id`);--> statement-breakpoint
ALTER TABLE `rooms` ADD `travel_distance_km` real;--> statement-breakpoint
ALTER TABLE `rooms` ADD `travel_duration_minutes` integer;--> statement-breakpoint
ALTER TABLE `rooms` ADD `travel_mode` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `travel_calculated_at` text;

```

Corresponding `src/db/schema.ts` additions to `rooms`:

```ts
venueId: text("venue_id").references(() => venues.id, { onDelete: "set null" }),
travelDistanceKm: real("travel_distance_km"),
travelDurationMinutes: integer("travel_duration_minutes"),
travelMode: text("travel_mode", { enum: ["driving", "walking", "cycling"] }),
travelCalculatedAt: text("travel_calculated_at"),

```

### 4.3 Semantics correction (matches your doc 2 §15 exactly)

```
rooms.lat / rooms.lng            -> becomes an alias for the venue's canonical coordinate
                                     (kept, unmodified type, so VenueMap/room cards/analytics
                                     don't need code changes — just gets a correct value now)
rooms.spot_lat / spot_lng /
  spot_address                   -> venue snapshot at creation time (address string + coords),
                                     denormalized so historical rooms stay readable even if a
                                     venue record is edited/deactivated later
rooms.creator_lat / creator_lng  -> NOT written by default (see §7 privacy note) — column stays
                                     nullable and available for a future feature, but this PRD's
                                     createRoomFn intentionally leaves it null
rooms.travel_distance_km /
  travel_duration_minutes /
  travel_mode / travel_calculated_at
                                  -> the HOST's ETA at creation time, snapshotted once, not
                                     recalculated later (see §5, "host ETA" vs "viewer distance")

```

### 4.4 Backward compatibility

Every new/repurposed column is nullable. Rooms created before this migration have `venue_id = null`, `spot_* = null`, `travel_* = null` and continue to render exactly as today — `rooms.lat/lng` for those old rows still holds whatever was captured previously (the host's GPS at creation, per the pre-existing bug), which is strictly a subset of what already renders today, not a regression.

---

## 5. Two distinct numbers — don't conflate them (per your doc 2 §23)

| Label Meaning Computed Shown |                                                                                    |                                                                                                                                                         |                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Viewer distance**          | How far _whoever is currently looking at the room_ is from the venue, right now    | Live, client-side, Haversine (unchanged — this was already correct in the existing code, just needs `rooms.lat/lng` to actually hold venue coordinates) | Room cards, room detail page, for every viewer                                                             |
| **Host ETA**                 | The _host's_ routed travel time from wherever they were when they created the room | Once, server-side, via ORS, at room-creation time only                                                                                                  | Room detail page, labeled explicitly `"Host's estimated travel: ~21 min"`, not applied to any other viewer |

This distinction was missing from v1 and is a direct adoption of your feedback — v1's `TravelEtaBadge` would have misleadingly reused one number for both.

---

## 6. Server functions

### 6.1 `src/server/venues.ts` — `searchVenuesFn`

```ts
.validator((d: { query?: string; sport?: string; city?: string }) => d)
.handler(async ({ data }) => {
  let rows = db.select().from(schema.venues)
    .where(and(eq(schema.venues.isActive, true), eq(schema.venues.coordinatesVerified, true)))
    .all();

  if (data.city) rows = rows.filter(v => v.city.toLowerCase() === data.city!.toLowerCase());
  if (data.sport) rows = rows.filter(v => (JSON.parse(v.sports) as string[]).includes(data.sport!));
  if (data.query) {
    const q = data.query.toLowerCase();
    rows = rows.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.locality ?? "").toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q),
    );
  }
  return rows.map(v => ({ ...v, sports: JSON.parse(v.sports) as string[] }));
});

```

In-memory filtering is fine at this scale (dozens of venues, not thousands) and matches the simplicity level of the rest of `src/server/*`. Move to SQL `LIKE`/`WHERE` clauses later if the venue count grows past a few hundred.

### 6.2 `src/server/travel.ts` — `estimateTravelFn`

```ts
.validator((d: {
  originLat: number; originLng: number;
  destLat: number; destLng: number;
  mode?: "driving" | "walking" | "cycling";
}) => d)
.handler(async ({ data }) => {
  const mode = data.mode ?? "driving";
  const orsResult = await callOpenRouteService(data.originLat, data.originLng, data.destLat, data.destLng, mode);
  if (orsResult.ok) {
    return {
      ok: true,
      source: "routed" as const,
      distanceKm: orsResult.distanceKm,
      durationMinutes: orsResult.durationMinutes,
      mode,
    };
  }
  // Fallback — explicitly labeled, not silently presented as routed
  const fallback = estimateHaversineFallback(data.originLat, data.originLng, data.destLat, data.destLng, mode);
  return { ok: true, source: "estimated" as const, ...fallback, mode };
});

```

`callOpenRouteService()` lives in a new `src/lib/routing.ts`, hits `https://api.openrouteservice.org/v2/directions/{profile}`, server-side only (the `ORS_API_KEY` never reaches the browser — this is why the routing call must be a `createServerFn`, not client-side `fetch`, correcting v1's fully-client-side design).

### 6.3 `createRoomFn` (modify existing, `src/server/rooms.ts`)

```ts
.validator((d: {
  sport: string;
  venueId: string;
  time: string;
  slots: number;
  skill: string;
  host: string;
  hostUserId?: string | undefined;
  description?: string | undefined;
  originLat?: number | null; // used only to compute travel_*, not persisted as creator_lat
  originLng?: number | null;
}) => d)
.handler(async ({ data }) => {
  const venue = db.select().from(schema.venues).where(eq(schema.venues.id, data.venueId)).get();
  if (!venue || !venue.coordinatesVerified) {
    return { ok: false, message: "Please choose a valid venue from the list." };
  }

  let travel: { distanceKm: number; durationMinutes: number; mode: string } | null = null;
  if (data.originLat != null && data.originLng != null) {
    const est = await estimateTravelFn({ data: {
      originLat: data.originLat, originLng: data.originLng,
      destLat: venue.lat!, destLng: venue.lng!, mode: "driving",
    }});
    travel = est.ok ? { distanceKm: est.distanceKm, durationMinutes: est.durationMinutes, mode: est.mode } : null;
  }

  const room = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sport: data.sport,
    venue: venue.name,
    city: venue.city,
    venueId: venue.id,
    lat: venue.lat,
    lng: venue.lng,
    spotAddress: venue.address,
    spotLat: venue.lat,
    spotLng: venue.lng,
    // creatorLat / creatorLng intentionally left null — see §7
    distanceKm: travel?.distanceKm ?? 0,
    travelDistanceKm: travel?.distanceKm ?? null,
    travelDurationMinutes: travel?.durationMinutes ?? null,
    travelMode: travel?.mode ?? null,
    travelCalculatedAt: travel ? new Date().toISOString() : null,
    time: data.time,
    slots: data.slots,
    skill: data.skill,
    host: data.host,
    hostUserId: data.hostUserId ?? null,
    description: data.description ?? null,
    filled: 1,
    avgElo: 1200,
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };
  db.insert(schema.rooms).values(room).run();
  // ...roomMembers insert + emitEvent unchanged
});

```

Routing failures (`travel === null`) do not block insertion — matches your acceptance criteria in §21/§27 of your doc.

---

## 7. Privacy (adopting your doc 2 §22 recommendation)

`createRoomFn` does **not** write `creatorLat`/`creatorLng` to the `rooms` row, even though the columns exist (post drift-fix) and are nullable. The origin coordinate is used in-memory for one `estimateTravelFn` call and then discarded — only the resulting `travelDistanceKm`/`travelDurationMinutes` (a derived number, not a raw location) is persisted. If a future feature genuinely needs the host's stored origin (e.g., "notify me if I'm running late"), that's a deliberate, separate product decision, not a default side effect of this one.

---

## 8. Venue picker UI

### 8.1 Reusing existing, already-installed, currently-unused components

`src/components/ui/command.tsx` (shadcn `Command`, built on the already-installed `cmdk` package) and `src/components/ui/popover.tsx` (Radix Popover) are **already in the repo and used nowhere** — same situation as the `input-otp` component found for the earlier auth PRD. This is exactly the searchable-dropdown primitive your spec calls for, with **zero new dependencies**.

### 8.2 New component: `src/components/rooms/VenuePicker.tsx`

```ts
interface VenuePickerProps {
  sport: string; // filters results to venues supporting this sport
  value: Venue | null;
  onChange: (venue: Venue) => void;
}
```

Behavior:

- `<Popover>` + `<PopoverTrigger>` button showing either "Search sports venue" (placeholder state) or the selected venue's name + locality (selected state), matching the "Selected: Sunrise Sports Arena / Bellandur, Bengaluru" mock in your doc.
- `<PopoverContent>` renders `<Command>` with a `<CommandInput placeholder="Search venue, area, or city" />`, debounced (\~250ms) calling `searchVenuesFn({ query, sport })`.
- Empty state: `"No venues found — try a different name or area."` (per your doc §20 — no free-text fallback; the whole point is canonical data).
- Each result row: venue name (bold) + `locality, city` (muted subtitle) — matches your mock exactly.

### 8.3 `CreateMatchModal.tsx` changes

- Venue `<input>` → `<VenuePicker sport={watchedSport} value={selectedVenue} onChange={setSelectedVenue} />`.
- New "Starting location" radio group (`Use my current location` / `Choose another location`), gated behind venue selection per your doc §9 (don't prompt for GPS until there's a reason to) — reuses the `useGeolocation()` instance already running on the parent `rooms.index.tsx` page rather than re-requesting permission.
- "Choose another location" reveals a **second** **`VenuePicker`****-style search**, but backed by a lightweight locality/city lookup (distinct `locality`/`city` values from `searchVenuesFn` results) rather than a full geocoder — flagged as a v3 candidate for a proper location-autocomplete (e.g. ORS's own `/geocode/search` endpoint, which is free under the same ORS key and could replace this cheaply later).
- Live travel-estimate panel once both venue + origin are known: calls `estimateTravelFn`, shows a "Calculating travel time…" loading state while in flight, then either the routed chip or the labeled fallback chip (§2.2), or an `"Travel time is currently unavailable"` message if both the routed call and the fallback inputs are missing.

---

## 9. Engineering task breakdown (updated)

**New / must-verify-before-launch:**

1. Geocode the 13 Tier-A venues (§3.2) — either run their verified addresses through ORS's free geocoding endpoint or manually pin-drop each in a mapping tool, then set `lat`/`lng` + `coordinatesVerified: true`. **Not done as part of this PRD** — flagged as the one task that requires a human/tool step outside pure code.
2. Sign up for an ORS API key, add `ORS_API_KEY` to env.

**Schema / DB:**
3\. Fix `schema.ts` drift for the 5 already-migrated `rooms` columns (§4.1) — verify `db:generate` produces no diff for them.
4\. Add `venues` table + new `rooms` columns (§4.2).
5\. Seed all 41 venues at their correct tier (§3.2); only Tier A becomes queryable once geocoded.

**Backend:**
6\. `src/lib/routing.ts` — ORS client + Haversine fallback.
7\. `src/server/venues.ts` — `searchVenuesFn`.
8\. `src/server/travel.ts` — `estimateTravelFn`.
9\. `createRoomFn` — venue-id-based, server-validated, travel snapshot on create (§6.3).

**Frontend:**
10\. `VenuePicker.tsx` using existing `Command`/`Popover`.
11\. `CreateMatchModal.tsx` — venue picker, starting-location radio group, live travel panel, loading/error states per §2.2 and your doc §18-19.
12\. Room card — keep existing viewer-distance line unchanged (it becomes accurate for free once `rooms.lat/lng` holds real venue coordinates); add a small "Host ETA: \~21 min" line only on the room detail page (§5), not on cards, to avoid the two-numbers confusion your doc flagged.

**Testing** (adopting your doc §30 list in full): GPS allowed / denied / unsupported, manual location, venue search with results / no results, invalid `venueId`, ORS failure → fallback path, ORS + fallback both unavailable, room creation with and without a travel estimate, pre-migration rooms still rendering, mobile permission prompts, changing venue or origin after an estimate is already shown (must recompute, not go stale).

---

## 10. Non-goals (unchanged from your doc §28)

Turn-by-turn navigation, live tracking, ride booking, public exposure of exact creator coordinates, full map-tile replacement of `VenueMap.tsx`, continuous ETA updates post-creation.

## 11. File-by-file summary

| File Change                                  |                                                                                                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/schema.ts`                           | Fix drift: declare `creatorLat/creatorLng/spotLat/spotLng/spotAddress` on `rooms`. Add `venues` table. Add `venueId/travelDistanceKm/travelDurationMinutes/travelMode/travelCalculatedAt` to `rooms`. |
| `drizzle/0007_venues_master.sql`             | New migration — `venues` table + new nullable `rooms` columns only (verified to produce zero diff for the already-applied 0006 columns)                                                               |
| `src/db/seed.ts`                             | + all 41 venues, tiered per §3.2                                                                                                                                                                      |
| `src/lib/routing.ts`                         | **New** — ORS client (`callOpenRouteService`) + Haversine fallback (`estimateHaversineFallback`)                                                                                                      |
| `src/server/venues.ts`                       | **New** — `searchVenuesFn`                                                                                                                                                                            |
| `src/server/travel.ts`                       | **New** — `estimateTravelFn`                                                                                                                                                                          |
| `src/server/rooms.ts`                        | `createRoomFn` — venue-id based, server-validated, travel snapshot                                                                                                                                    |
| `src/components/rooms/VenuePicker.tsx`       | **New** — searchable autocomplete on existing `Command`/`Popover`                                                                                                                                     |
| `src/components/modals/CreateMatchModal.tsx` | Venue input → `VenuePicker`; starting-location step; live travel panel                                                                                                                                |
| `src/routes/rooms.$roomId.tsx`               | Add "Host's estimated travel: \~X min" line, sourced from `room.travelDurationMinutes` (§5) — replaces the old dead `Math.round(distanceKm * 4)` line                                                 |

**Unchanged:** `VenueMap.tsx`, room cards' existing viewer-distance line (becomes correct automatically), `JoinRoomModal.tsx`, chat, matches, leaderboard, analytics, auth.

Env vars to document in `README.md`: `ORS_API_KEY` (server-only, required for routed ETAs; app degrades to the labeled fallback estimate without it — never hard-fails room creation).
