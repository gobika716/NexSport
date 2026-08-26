# NexSport: Venue Dropdown + Location-Based Route Map PRD

**Phases 1 & 2: Complete Venue Directory & GPS-Aware Route Planning**

---

## Overview

This PRD covers implementing a venue directory dropdown (Phase 1) and location permission + real map with ETA (Phase 2) for the NexSport match creation flow. Each phase is **self-contained** but will be executed in sequence with **human confirmation** between phases.

**Key Constraint:** Zero breaking changes. Existing flows (manual venue entry, landing-page modal) must stay functional.

---

## Part 1: Codebase Analysis Summary

### Current State (Verified Against Live Clone)

| Area                    | Finding                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework Stack**     | React 19 + TanStack Start (SSR) + Vite + better-sqlite3 + Drizzle ORM                                                                                                                                                                 |
| **Modal Location**      | `src/components/modals/CreateMatchModal.tsx` (fully client-side, no server calls)                                                                                                                                                     |
| **Current Venue Input** | Free-text `<input>`, no validation, passed to `onCreated` callback                                                                                                                                                                    |
| **Integration Points**  | Used on `/rooms` (with `onCreated` handler) AND `/` (landing page, no handler)                                                                                                                                                        |
| **Geolocation**         | `src/hooks/use-geolocation.ts` exists, used with `autoStart: true` on rooms page; will be reused for Phase 2                                                                                                                          |
| **Rooms DB Schema**     | Has `lat`, `lng` (host GPS, set at creation), `venue` (text), no foreign key to venues yet                                                                                                                                            |
| **UI Primitives**       | `<Popover>` and `<Command>` (cmdk-based) already in `src/components/ui/`                                                                                                                                                              |
| **RHF Integration**     | Already used in modal via `useForm`, `register` pattern                                                                                                                                                                               |
| **DB Migrations**       | Pattern: `drizzle/*.sql` numbered sequentially. Latest is `0007_demonic_jackpot.sql` which **dropped** `creator_lat`, `creator_lng`, `spot_lat`, `spot_lng`, `spot_address` (failed venue geolocation feature). We avoid this naming. |
| **Server Functions**    | `createRoomFn` in `src/server/rooms.ts` already accepts optional `lat`, `lng`, `description`; no venue FK yet                                                                                                                         |
| **Mapping Libraries**   | **None installed yet** — Leaflet will be added in Phase 2                                                                                                                                                                             |

### Venue Source Data

- 41 Erode-region venues provided (name, area, address, confidence level)
- **No coordinates yet** — will be geocoded via Nominatim in Phase 0 (prep task, non-phase work)
- Example: "The Colosseum Sports – Bhavani", "Komarapalayam", "Komarapalayam, New Bridge Road, near Bhavani New Bus Stand, Bhavani, Tamil Nadu 638301", "High"

---

## Part 2: Architecture & Design Decisions

### 2.1 Venue Data Model

**New `venues` table** (Phase 0 prep, before Phase 1):

```ts
// src/db/schema.ts — ADD THIS NEW TABLE

export const venues = sqliteTable(
  "venues",
  {
    id: text("id").primaryKey(), // v-the-colosseum-sports-bhavani
    name: text("name").notNull(), // The Colosseum Sports – Bhavani
    area: text("area").notNull(), // Komarapalayam
    address: text("address").notNull(), // Full address
    city: text("city").notNull().default("Erode"),
    lat: real("lat"), // Geocoded from address (nullable if failed)
    lng: real("lng"), // Geocoded from address (nullable if failed)
    confidence: text("confidence", {
      enum: ["high", "medium", "low"],
    })
      .notNull()
      .default("medium"),
    source: text("source"), // "Playo", "Lobbi", "manual" etc.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_venues_city").on(table.city),
    index("idx_venues_active").on(table.isActive),
  ],
);

export type Venue = typeof venues.$inferSelect;
```

**Rooms table: ADD THREE OPTIONAL COLUMNS** (same migration):

```ts
// Inside existing `rooms` table definition in schema.ts, ADD:
venueId: text("venue_id").references(() => venues.id, { onDelete: "set null" }),
venueLat: real("venue_lat"),
venueLng: real("venue_lng"),
```

**Why this shape:**

- `rooms.lat`/`lng` remain untouched (host GPS at creation time)
- New `venueLat`/`venueLng` hold the **venue's** coordinates (from the directory)
- `venueId` links to the selected venue (useful for filtering/analytics later)
- Everything is **nullable** — manual venue entry leaves these as `null`, no breaking change

### 2.2 Phase 1: Venue Dropdown (UI-Only, No Maps)

**Objective:** Replace free-text venue input with a searchable combobox backed by the venues table.

**Data Flow:**

1. Modal opens → TanStack Query fetches `listVenuesFn()` (GET, filters active venues)
2. User types → client-side filter on name + area
3. User selects venue → field updates, stores `selectedVenue` (Venue object) + `selectedVenueId` in component state
4. User can still click "Can't find it?" → reverts to manual text entry (backward-compatible)
5. Form submit → `onCreated` callback receives both `venue: string` (display name, same as before) AND new optional `venueLat`, `venueLng`, `venueId`

**Critical Non-Breaking Requirements:**

- Manual entry fallback **always works** — users not in directory aren't blocked
- `/` landing page modal **never breaks** — doesn't fetch venues, doesn't require `onCreated`
- Payload shape to `onCreated` is **additive only** — new fields are optional, existing code ignores them

### 2.3 Phase 2: Permission + Live Map (UI + Geolocation + Map Rendering)

**Objective:** When a directory venue is selected (not manual entry), ask for location permission and show a real map with route + ETA.

**Data Flow:**

1. User selects a real venue → permission card appears: _"Show me the route to {venue.name}?"_
2. Click "Use my location" → `useGeolocation.start()` with `autoStart: false` (new instance in modal)
3. Permission granted → browser geolocation fires, position updated in hook state
4. `status === "granted"` + `selectedVenue` + `position` all present → render `<VenueRoutePreview />`
5. Route preview component:
   - Leaflet map with OSM tiles
   - Two markers: user + venue
   - Fetches route from OSRM (free demo server, no key)
   - Shows distance + ETA in a floating badge (walking icon + "X min" + "Y km")
   - Fallback to straight-line distance if OSRM unreachable
6. User can submit form at any time — location permission is never required, only optional for map

**Critical Non-Breaking:**

- Manual venue entry → no permission prompt, no map
- Permission denied → form still submits, map just doesn't render
- Closing modal → `stop()` geolocation watch (no background battery drain)

### 2.4 Tech Stack for Phase 2

**New dependencies (free, no API keys):**

- **Leaflet** (`leaflet`) — map rendering, MIT license, requires proper OSM attribution
- **React Leaflet** (`react-leaflet`) — React bindings for Leaflet
- **@types/leaflet** — TypeScript types

**Free external services:**

- **OSRM** (`https://router.project-osrm.org/`) — route + ETA, free public demo server, no key
  - Profiles: `driving`, `foot`, `bike`
  - Response: `duration` (seconds), `distance` (meters), `routes[0].geometry` (GeoJSON)
- **OSM tiles** (`https://{s}.tile.openstreetmap.org/`) — free, attribution required in layer

**Fallback for OSRM failure:**

- Haversine distance (already in `use-geolocation.ts` as `haversineKm`)
- Assume average speed: 30 km/h (driving), 5 km/h (walking)
- Label as "(estimated)" to be honest

---

## Part 3: Execution Plan

### ⚠️ **Pre-Phase Work (Phase 0 Prep — NOT a Phase, But Prerequisite)**

**Objective:** Create venues table, seed with 41 venues + geocoded coordinates, deploy migration.

**Tasks:**

1. **Schema Update:**
   - Edit `src/db/schema.ts`:
     - Add `venues` table definition (see §2.1 above)
     - Add three columns to `rooms`: `venueId`, `venueLat`, `venueLng`
   - Run: `npm run db:generate`
   - Review generated `drizzle/0008_*.sql` — should only have `CREATE TABLE venues` + `ALTER TABLE rooms ADD ...`

2. **Migration:**
   - Run: `npm run db:migrate`
   - Confirm `nexsport.db` now has `venues` table

3. **Seed Venues:**
   - Create `src/db/seed-venues.ts` (separate from `seed.ts`)
   - Hardcode all 41 venues (name, area, address, source, confidence)
   - For each, geocode via Nominatim:
     ```
     https://nominatim.openstreetmap.org/search?format=json&q={address},%20{area},%20Erode,%20Tamil%20Nadu
     ```
     - Use `User-Agent: NexSport/1.0 (contact: team-email)`
     - Wait 1100ms between requests (1 req/sec policy)
     - Extract first result's `lat`, `lng`
     - If fails, fall back to area-level: `{area}, Erode, Tamil Nadu`
     - Log: count of exact geocodes, area fallbacks, failures
     - **Do NOT insert null-coordinate rows silently** — print warnings
   - Add script to `package.json`: `"db:seed-venues": "tsx src/db/seed-venues.ts"`
   - Run: `npm run db:seed-venues`

4. **Create Server Function:**
   - `src/server/venues.ts` (new file):
     ```ts
     export const listVenuesFn = createServerFn({ method: "GET" })
       .validator((d: { search?: string } | undefined) => d ?? {})
       .handler(async ({ data }) => {
         const rows = db
           .select()
           .from(schema.venues)
           .where(eq(schema.venues.isActive, true))
           .orderBy(schema.venues.name)
           .all();
         return data.search
           ? rows.filter(
               (v) =>
                 v.name.toLowerCase().includes(data.search!.toLowerCase()) ||
                 v.area.toLowerCase().includes(data.search!.toLowerCase()),
             )
           : rows;
       });
     ```

5. **Verify:**
   - `npm run db:setup` from clean DB
   - `npm run build` and `npm run lint` pass
   - Open `nexsport.db` with SQLite browser, confirm 41 rows in `venues`, lat/lng in range ~11.2–11.5 / 77.5–77.9

**🛑 STOP — Do NOT proceed to Phase 1 until venues table is seeded and verified.**

---

## PHASE 1: Venue Dropdown in CreateMatchModal

**Duration Estimate:** 2–3 hours (implementation + testing)

**Objective:** Replace free-text venue input with a searchable combobox. No maps, no geolocation.

### 1.1 Files to Touch

- `src/components/modals/CreateMatchModal.tsx` (main change)
- `src/db/schema.ts` — already updated in Phase 0
- `src/server/venues.ts` — already created in Phase 0
- No changes to `/routes/rooms.index.tsx` or `/routes/index.tsx`

### 1.2 Tasks

#### Task 1.2.1: Import New Dependencies

```tsx
// At the top of CreateMatchModal.tsx

import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { listVenuesFn } from "@/server/venues";
import { cn } from "@/lib/utils";
import type { Venue } from "@/db/schema";
```

#### Task 1.2.2: Extend MatchValues Interface

```tsx
interface MatchValues {
  sport: string;
  venue: string;
  date: string;
  players: number;
  skill: string;
  // NEW: optional venue metadata (for Phase 2/4)
  venueId?: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
}
```

#### Task 1.2.3: Update Component State & Logic

Replace the current CreateMatchModal function body with:

```tsx
export function CreateMatchModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (values: MatchValues) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState(false); // NEW: toggle for manual fallback
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null); // NEW

  // Fetch venues only when modal is open, enabled: open
  const { data: venues = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: () => listVenuesFn(),
    enabled: open && !manualEntry, // Don't fetch if in manual mode
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MatchValues>({
    defaultValues: {
      sport: "Badminton",
      players: 4,
      skill: "Open (all levels)",
      venue: "",
      venueId: null,
      venueLat: null,
      venueLng: null,
    },
  });

  const venueValue = watch("venue");

  const handleVenueSelect = (venue: Venue) => {
    setValue("venue", venue.name);
    setValue("venueId", venue.id);
    setValue("venueLat", venue.lat ?? undefined);
    setValue("venueLng", venue.lng ?? undefined);
    setSelectedVenue(venue);
    setPopoverOpen(false);
  };

  const handleManualEntry = () => {
    setManualEntry(true);
    setSelectedVenue(null);
    setValue("venueId", null);
    setValue("venueLat", null);
    setValue("venueLng", null);
    setPopoverOpen(false);
  };

  const handleBackToDirectory = () => {
    setManualEntry(false);
    setValue("venue", "");
    setSelectedVenue(null);
    setValue("venueId", null);
    setValue("venueLat", null);
    setValue("venueLng", null);
  };

  const onSubmit = (values: MatchValues) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onCreated?.(values);
      toast.success("Match room created", {
        description: `${values.sport} at ${values.venue} · ${values.players} players`,
      });
      onClose();
      reset();
      // Reset component state
      setManualEntry(false);
      setSelectedVenue(null);
    }, 700);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create a match"
      subtitle="Mock flow — your match stays on this device."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Sport</label>
          <select className={fieldClass} {...register("sport")}>
            {matchSports.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* NEW: Venue Dropdown or Manual Input */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Venue</label>

          {!manualEntry ? (
            <>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      fieldClass,
                      "flex items-center justify-between",
                      !selectedVenue && "text-gray-text",
                    )}
                  >
                    <span className="truncate text-left">
                      {selectedVenue?.name || "Search venues…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or area…" />
                    <CommandEmpty>No venue found.</CommandEmpty>
                    <CommandGroup>
                      {venues.map((v) => (
                        <CommandItem
                          key={v.id}
                          value={v.name}
                          onSelect={() => handleVenueSelect(v)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVenue?.id === v.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{v.name}</div>
                            <div className="text-xs text-gray-text">{v.area}</div>
                          </div>
                        </CommandItem>
                      ))}
                      {/* Manual entry fallback */}
                      <CommandItem onSelect={handleManualEntry}>
                        <div className="ml-6 text-sm text-gray-text">
                          Can't find your venue? Enter manually
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.venue ? (
                <p className="mt-1 text-xs text-destructive">{errors.venue.message}</p>
              ) : null}
            </>
          ) : (
            <>
              <input
                className={fieldClass}
                placeholder="Sunrise Sports Arena"
                {...register("venue", { required: "Venue is required" })}
              />
              <button
                type="button"
                onClick={handleBackToDirectory}
                className="mt-1.5 text-xs font-semibold text-sky hover:underline"
              >
                ← Back to directory
              </button>
              {errors.venue ? (
                <p className="mt-1 text-xs text-destructive">{errors.venue.message}</p>
              ) : null}
            </>
          )}
        </div>

        {/* Rest of form unchanged */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Date & time</label>
            <input
              type="datetime-local"
              className={fieldClass}
              {...register("date", { required: "Pick a slot" })}
            />
            {errors.date ? (
              <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Players</label>
            <input
              type="number"
              min={2}
              max={30}
              className={fieldClass}
              {...register("players", {
                valueAsNumber: true,
                required: "Required",
                min: { value: 2, message: "At least 2" },
              })}
            />
            {errors.players ? (
              <p className="mt-1 text-xs text-destructive">{errors.players.message}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Skill band</label>
          <select className={fieldClass} {...register("skill")}>
            {skillBands.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Publish match"}
        </Button>
      </form>
    </ModalShell>
  );
}
```

#### Task 1.2.4: Verify No Breaking Changes

Checklist:

- [ ] `/routes/index.tsx` (landing page) modal still opens and submits to `toast.success`
- [ ] `/routes/rooms.index.tsx` still calls `handleCreated`, which receives values with `venue: string`
- [ ] Manual venue entry path still works end-to-end (pick manual, type name, submit)
- [ ] Selecting a directory venue and submitting shows the same toast + creates a room
- [ ] No TypeScript errors
- [ ] No new console warnings

### 1.3 Testing Checklist

#### Desktop (Chrome/Edge/Firefox):

- [ ] Open `/rooms` → click "Create match room"
- [ ] Modal opens, venue field shows dropdown trigger "Search venues…"
- [ ] Type "colosseum" → list filters to matching venues
- [ ] Type "komarapalayam" (area) → filters to area-based matches
- [ ] Select one → field populates with venue name (bold), area visible in dropdown still
- [ ] Popover closes
- [ ] Click trigger again → list shows, selected item has checkmark
- [ ] Click "Can't find..." → reverts to text input, "Back to directory" link appears
- [ ] Type any text → field accepts it
- [ ] Submit form → toast + room created in DB with `venue` = typed text, `venueId` = `null`
- [ ] Open landing page `/` → modal CTA still works (no `onCreated`, just toast)

#### Mobile (iPhone simulator or real device, Chrome):

- [ ] Popover doesn't overflow screen width
- [ ] Combobox input is tappable, full-size
- [ ] List is scrollable if tall

#### Browser DevTools:

- [ ] No TypeScript errors in output
- [ ] No React warnings about missing deps
- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds

### 1.4 Acceptance Criteria

✅ **Phase 1 Complete when:**

1. Directory venues dropdown renders in modal with search
2. Manual entry fallback works (can still enter free text if venue not in list)
3. Form submission includes `venue` name + optional `venueId`/`venueLat`/`venueLng`
4. `/routes/rooms.index.tsx` receives values and can pass to `createRoomFn` (currently ignores new fields, adds to them in Phase 4)
5. `/routes/index.tsx` modal unaffected
6. `npm run build` + `npm run lint` pass
7. Manual test: create a room via directory venue, create another via manual entry — both succeed and show in rooms list

**🛑 STOP HERE — Confirm Phase 1 before proceeding to Phase 2.**

---

## PHASE 2: Location Permission + Real Map with ETA

**Duration Estimate:** 4–5 hours (map setup + OSRM integration + UI)

**Objective:** When a directory venue is selected, ask for location, fetch user position, render a live map with route + ETA badge.

### 2.1 Files to Touch

- `src/components/modals/CreateMatchModal.tsx` (add permission card + map slot)
- `src/components/modals/VenueRoutePreview.tsx` (**new** — map + route component)
- `package.json` (add Leaflet + react-leaflet)
- `src/styles.css` or `src/index.css` (import Leaflet CSS once)

### 2.2 Dependencies to Add

Run:

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

**Verify in `package.json`:**

```json
"dependencies": {
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.x.x"
}
"devDependencies": {
  "@types/leaflet": "^1.9.x"
}
```

### 2.3 Global Leaflet CSS Import

Edit `src/styles.css` (top of file, before Tailwind imports):

```css
@import "leaflet/dist/leaflet.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2.4 Create VenueRoutePreview Component

**File:** `src/components/modals/VenueRoutePreview.tsx` (new)

```tsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import { AlertCircle, MapPin, Navigation, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { haversineKm, formatDistanceKm } from "@/hooks/use-geolocation";

interface RouteData {
  distanceKm: number;
  durationMinutes: number;
  geometry: Array<[number, number]>;
}

interface VenueRoutePreviewProps {
  userLat: number;
  userLng: number;
  venueLat: number;
  venueLng: number;
  venueName: string;
  mode?: "driving" | "walking";
  onModeChange?: (mode: "driving" | "walking") => void;
}

// Custom icons
const userIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxIiBmaWxsPSIjM2I4MmY2Ii8+PC9zdmc+",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const venueIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxIiBmaWxsPSIjZWY0NDQ0Ii8+PC9zdmc+",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Sub-component: controls the map fit
function MapFit({ bounds }: { bounds?: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds([bounds[0], bounds[1]], { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export function VenueRoutePreview({
  userLat,
  userLng,
  venueLat,
  venueLng,
  venueName,
  mode = "walking",
  onModeChange,
}: VenueRoutePreviewProps) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  // Fetch route from OSRM when component mounts or mode changes
  useEffect(() => {
    fetchRoute();
  }, [mode]);

  async function fetchRoute() {
    setLoading(true);
    setError(null);
    const osrmMode = mode === "walking" ? "foot" : "driving";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/${osrmMode}/${userLng},${userLat};${venueLng},${venueLat}?overview=full&geometries=geojson`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Route not available");
      const data = await res.json();

      if (!data.routes || !data.routes[0]) throw new Error("No route found");

      const route0 = data.routes[0];
      setRoute({
        distanceKm: (route0.distance as number) / 1000,
        durationMinutes: Math.round((route0.duration as number) / 60),
        geometry: (route0.geometry.coordinates as Array<[number, number]>).map((c) => [c[1], c[0]]),
      });
      setFallbackMode(false);
    } catch (err) {
      // Fallback: straight line + haversine distance
      const distKm = haversineKm(userLat, userLng, venueLat, venueLng);
      const speedKmh = mode === "walking" ? 5 : 30;
      const durationMinutes = Math.round((distKm / speedKmh) * 60);

      setRoute({
        distanceKm: distKm,
        durationMinutes: durationMinutes,
        geometry: [
          [userLat, userLng],
          [venueLat, venueLng],
        ],
      });
      setFallbackMode(true);
      setError(null); // Don't show error, just use fallback silently
    } finally {
      setLoading(false);
    }
  }

  if (!route || loading) {
    return (
      <div className="mt-4 h-64 flex items-center justify-center bg-secondary/40 rounded-lg">
        <div className="text-sm text-gray-text">Loading map…</div>
      </div>
    );
  }

  const userPos = new LatLng(userLat, userLng);
  const venuePos = new LatLng(venueLat, venueLng);

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => onModeChange?.("walking")}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
            mode === "walking"
              ? "bg-sky border-sky text-white"
              : "border-border text-gray-text hover:text-ink",
          )}
        >
          🚶 Walking
        </button>
        <button
          type="button"
          onClick={() => onModeChange?.("driving")}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
            mode === "driving"
              ? "bg-sky border-sky text-white"
              : "border-border text-gray-text hover:text-ink",
          )}
        >
          🚗 Driving
        </button>
      </div>

      {/* Map container */}
      <div className="relative h-64 rounded-lg overflow-hidden border border-border/50">
        <MapContainer
          center={[userLat, userLng]}
          zoom={15}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* Route line */}
          <Polyline
            positions={route.geometry}
            color={mode === "walking" ? "#06b6d4" : "#3b82f6"}
            weight={4}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />

          {/* User marker */}
          <Marker position={userPos} icon={userIcon}>
            <Popup>Your location</Popup>
          </Marker>

          {/* Venue marker */}
          <Marker position={venuePos} icon={venueIcon}>
            <Popup>{venueName}</Popup>
          </Marker>

          {/* Auto-fit bounds */}
          <MapFit bounds={[userPos, venuePos]} />
        </MapContainer>

        {/* Floating ETA badge */}
        <div className="absolute top-3 left-3 bg-white shadow-lg rounded-lg px-3.5 py-2.5 border border-border">
          <div className="flex items-center gap-2">
            <div className="text-lg">{mode === "walking" ? "🚶" : "🚗"}</div>
            <div className="flex flex-col">
              <div className="font-semibold text-sm text-ink">
                {route.durationMinutes} min{fallbackMode ? "*" : ""}
              </div>
              <div className="text-xs text-gray-text">{formatDistanceKm(route.distanceKm)}</div>
            </div>
          </div>
          {fallbackMode && (
            <div className="text-[10px] text-gray-text mt-1 leading-tight">
              *estimated (offline route)
            </div>
          )}
        </div>
      </div>

      {/* Attribution note */}
      <div className="text-[11px] text-gray-text leading-tight">
        <p>Map data © OpenStreetMap • Route by OSRM</p>
      </div>
    </div>
  );
}
```

### 2.5 Update CreateMatchModal for Phase 2

Edit `src/components/modals/CreateMatchModal.tsx`:

Add imports:

```tsx
import { VenueRoutePreview } from "./VenueRoutePreview";
import { useGeolocation } from "@/hooks/use-geolocation";
```

Extend component state:

```tsx
export function CreateMatchModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (values: MatchValues) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [routeMode, setRouteMode] = useState<"driving" | "walking">("walking");

  // NEW: Geolocation hook with autoStart: false
  const {
    position: userPosition,
    status: geoStatus,
    start: startGeo,
    stop: stopGeo,
  } = useGeolocation({
    autoStart: false,
  });

  // ... rest of form state ...

  // NEW: When modal closes, stop geolocation watch
  useEffect(() => {
    if (!open) {
      stopGeo();
    }
  }, [open, stopGeo]);

  // ... existing handlers ...

  const handleStartLocation = () => {
    startGeo();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create a match"
      subtitle="Mock flow — your match stays on this device."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Sport, Venue dropdowns (same as Phase 1) ... */}
        {/* ... Date, Players, Skill (unchanged) ... */}

        {/* NEW: Location Permission Card (only shown if venue is from directory + no permission yet) */}
        {selectedVenue && !manualEntry && (
          <div className="rounded-lg border border-border/50 bg-sky/5 p-3.5">
            {geoStatus === "idle" && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">
                  Show me the route to {selectedVenue.name}?
                </p>
                <p className="text-xs text-gray-text">
                  We'll use your location to display the distance and travel time.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleStartLocation}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <Navigation size={14} />
                    Use my location
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-gray-text hover:text-ink transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}
            {geoStatus === "locating" && (
              <div className="flex items-center gap-2 text-sm text-gray-text">
                <div className="h-3 w-3 rounded-full bg-sky animate-pulse" />
                Finding your location…
              </div>
            )}
            {geoStatus === "denied" && (
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
                <p className="text-xs text-gray-text">
                  Location permission was denied. You can still create the match — the live route
                  map just won't show.
                </p>
              </div>
            )}
            {geoStatus === "error" || geoStatus === "unsupported" ? (
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
                <p className="text-xs text-gray-text">
                  Location unavailable. You can still create the match.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* NEW: Map Preview (only if user granted permission + selected venue + has coords) */}
        {selectedVenue &&
          !manualEntry &&
          geoStatus === "granted" &&
          userPosition &&
          selectedVenue.lat != null &&
          selectedVenue.lng != null && (
            <VenueRoutePreview
              userLat={userPosition.lat}
              userLng={userPosition.lng}
              venueLat={selectedVenue.lat}
              venueLng={selectedVenue.lng}
              venueName={selectedVenue.name}
              mode={routeMode}
              onModeChange={setRouteMode}
            />
          )}

        {/* Fallback if venue has no coordinates */}
        {selectedVenue &&
          !manualEntry &&
          geoStatus === "granted" &&
          userPosition &&
          (selectedVenue.lat == null || selectedVenue.lng == null) && (
            <div className="rounded-lg bg-secondary/40 p-3.5 text-center">
              <p className="text-xs text-gray-text">
                Live route map isn't available for this venue yet.
              </p>
            </div>
          )}

        {/* Existing submit button */}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Publish match"}
        </Button>
      </form>
    </ModalShell>
  );
}
```

### 2.6 Update rooms.index.tsx to Pass Venue Coordinates

Edit `src/routes/rooms.index.tsx`, the `handleCreated` function:

```tsx
const handleCreated = async (room: {
  sport: string;
  venue: string;
  date: string;
  players: number;
  skill: string;
  // NEW: optional venue metadata
  venueId?: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
}) => {
  const created = await createRoomFn({
    data: {
      sport: room.sport,
      venue: room.venue,
      city: myPosition ? "Current location" : "Your area",
      distanceKm: 0,
      time: room.date
        ? new Date(room.date).toLocaleString(undefined, {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          })
        : "Time to be confirmed",
      slots: room.players,
      skill: room.skill,
      host: user?.name ?? "You",
      ...(user?.id ? { hostUserId: user.id } : {}),
      description: "Your room is live — nearby players have been notified.",
      ...(myPosition ? { lat: myPosition.lat, lng: myPosition.lng } : {}),
      // NEW: pass venue coordinates if available
      ...(room.venueId ? { venueId: room.venueId } : {}),
      ...(room.venueLat ? { venueLat: room.venueLat } : {}),
      ...(room.venueLng ? { venueLng: room.venueLng } : {}),
    },
  });
  setJoinedIds((prev) => [...prev, created.id]);
  await queryClient.invalidateQueries({ queryKey: ["rooms"] });
  toast.success("Match room created & joined as Host!", {
    description: `${created.sport} at ${created.venue} · ${created.slots} players`,
  });
};
```

**Note:** `createRoomFn` in `src/server/rooms.ts` already accepts these optional fields in its validator, so no change needed there yet (will be formalized in Phase 4).

### 2.7 Testing Checklist

#### Geolocation Flow:

- [ ] Open `/rooms` → "Create match room"
- [ ] Select a directory venue → permission card appears
- [ ] Click "Use my location" → browser permission prompt appears
- [ ] Grant permission → "Finding your location…" spinner appears
- [ ] After ~1–2s → map renders with two markers + route line + ETA badge (e.g., "12 min, 2.3 km")
- [ ] Toggle "Driving" → map re-fetches route, ETA changes
- [ ] Toggle "Walking" → ETA changes again
- [ ] Close modal → geolocation watch is stopped (no lingering tab icon in browser)

#### Denial Flow:

- [ ] Create new match → select venue → "Use my location"
- [ ] Deny permission in browser → card shows "Location permission was denied…"
- [ ] Form still submits successfully
- [ ] Room is created with `lat`/`lng` from host GPS (if enabled), `venueLat`/`venueLng` still populated

#### Manual Entry:

- [ ] Select manual entry → no permission card appears
- [ ] Form submits → room created with `venueId` = `null`

#### No Coordinates:

- [ ] Manually add a venue to DB with `lat = null`, `lng = null`
- [ ] Select it → permission card appears, user grants
- [ ] "Live route map isn't available…" message shown instead of map
- [ ] Form still submits

#### Browser Offline / OSRM Failure:

- [ ] Simulate offline mode in DevTools → select venue, grant permission
- [ ] Map still renders with **dashed line** and **(estimated)** ETA label
- [ ] Form submits normally

#### Landing Page (`/`):

- [ ] Open `/` → modal CTA button
- [ ] Modal opens without permission card (no geolocation)
- [ ] Venue dropdown works
- [ ] Submit → toast appears, modal closes
- [ ] No console errors

#### Mobile (iPhone iOS Safari or Android Chrome):

- [ ] Popover/combobox doesn't overflow
- [ ] Map is tappable, zoom/pan works
- [ ] ETA badge stays in top-left, doesn't overlap controls
- [ ] "Back to directory" link is tappable

#### Build & Lint:

- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds
- [ ] No TypeScript errors
- [ ] Bundle size increase acceptable (Leaflet adds ~40–50 KB gz)

### 2.8 Acceptance Criteria

✅ **Phase 2 Complete when:**

1. Directory venue selection triggers a permission card
2. On permission grant: map renders with markers, route line, and ETA badge
3. Mode toggle (walking/driving) re-fetches route and updates ETA
4. Permission denial/error doesn't block form submission
5. Manual venue entry never triggers permission card or map
6. OSRM failure falls back to haversine + labeled "(estimated)"
7. Venues with null coordinates show friendly message, don't crash
8. Modal close stops geolocation watch
9. `/` landing page modal unaffected
10. `npm run build` + `npm run lint` pass
11. Manual test: create a room via directory venue + location permission — room appears in list, shows both host GPS and venue coordinates

**🛑 STOP HERE — Confirm Phase 2 before proceeding to Phase 3 (if needed).**

---

## PHASE 3 (Optional Future): Persist to DB & Enhanced UX

**Out of scope for this PRD.** When approved, Phase 3 will:

- Formally update `createRoomFn` validator to accept `venueId`, `venueLat`, `venueLng`
- Display venue location on room cards (different from host GPS)
- Filter rooms by distance to user's selected venue
- Admin panel to manage venue directory (add/edit/inactive)

---

## Success Metrics & Rollback Plan

### Metrics

- Venue dropdown adoption: % of room creations via directory (vs. manual)
- Average permission grant rate on selection of directory venue
- Route map render success rate (OSRM vs. fallback)
- Mobile conversion: room creation on mobile via venue directory

### Rollback

- If Phase 1 breaks existing flow: revert `CreateMatchModal.tsx` + `listVenuesFn`
- If Phase 2 breaks form: disable permission card via feature flag `const ENABLE_VENUE_ROUTES = false`
- Venues table is always safe to leave (unused if modal disabled)

---

## Team Handoff Notes

### For Frontend Developers:

- Leaflet map can be styled further in `VenueRoutePreview.tsx` (custom tile layers, custom markers, etc.)
- OSRM fallback threshold is hardcoded as 6s timeout — adjust in `fetchRoute()`
- Permission copy/tone can be refined in the card

### For Backend/DevOps:

- Nominatim geocoding is one-time seed-time cost (no runtime calls)
- OSRM public demo server is used (no private instance) — if volume grows, self-host OSRM
- No API keys, no billing: fully free tier
- SQLite schema change is additive only (safe for live DB)

### For QA:

- Primary test: create room via directory venue + permission grant → verify map renders, room saves correctly
- Secondary: verify manual entry path still works without changes
- Regression: confirm landing-page modal, all other room features unaffected

---

## Appendix: Tech Details

### A. OSRM Endpoints

- **Route:** `GET https://router.project-osrm.org/route/v1/{profile}/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson`
- **Profiles:** `driving`, `foot`, `bike`
- **Response:** `routes[0].duration` (seconds), `routes[0].distance` (meters), `routes[0].geometry` (GeoJSON)
- **Rate limit:** ~6 req/sec per IP (acceptable for this app scale)
- **SLA:** Best-effort demo server, no guarantee

### B. OSM Tile Attribution

**Required by license:** Include in every map that uses OSM tiles.

```html
&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors
```

### C. Leaflet Marker Icons

Custom icons are base64-encoded SVGs in `VenueRoutePreview.tsx`:

- **User marker:** Blue circle (sky color, `#3b82f6`)
- **Venue marker:** Red circle (destructive color, `#ef4444`)

### D. Haversine Fallback

When OSRM is unreachable:

- Distance: calculated client-side via `haversineKm()` (already in codebase)
- Duration: `distanceKm / avgSpeedKmh * 60` where:
  - Walking: 5 km/h
  - Driving: 30 km/h
- Labeled "(estimated)" in ETA badge

### E. Nominatim Geocoding (Seed Time Only)

- **Endpoint:** `GET https://nominatim.openstreetmap.org/search?format=json&q={query}`
- **Rate Limit:** 1 request/second max
- **User-Agent:** Must be descriptive (e.g., `NexSport/1.0 (contact: team@nexsport.app)`)
- **Timeout:** 10s per request
- **Fallback:** If exact address fails, try area-level (e.g., "Komarapalayam, Erode")

---

## Sign-Off

**Prepared by:** Claude (AI Agent)
**Date:** August 26, 2026
**Status:** Ready for Phase 0 Prep (venue seeding) → Phase 1 → Phase 2 execution
**Review & Approval Required Before Proceeding**
