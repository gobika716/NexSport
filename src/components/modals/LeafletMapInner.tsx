import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import { cn } from "@/lib/utils";
import { formatDistanceKm } from "@/hooks/use-geolocation";

export interface RouteData {
  distanceKm: number;
  durationMinutes: number;
  geometry: Array<[number, number]>;
}

export interface LeafletMapInnerProps {
  userLat: number;
  userLng: number;
  venueLat: number;
  venueLng: number;
  venueName: string;
  mode: "driving" | "walking";
  route: RouteData;
  fallbackMode: boolean;
  onModeChange?: (mode: "driving" | "walking") => void;
}

// Custom user & venue marker icons (SVG data URIs for robust cross-bundler rendering)
const userIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10' fill='%233b82f6' fill-opacity='0.25'/><circle cx='12' cy='12' r='4' fill='%233b82f6'/></svg>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const venueIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' fill='%23ef4444' fill-opacity='0.85'/><circle cx='12' cy='10' r='3' fill='white'/></svg>",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Helper component: fits map bounds around both user & venue coordinates
function MapFit({ bounds }: { bounds?: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      try {
        map.fitBounds([bounds[0], bounds[1]], { padding: [40, 40] });
      } catch {
        // Ignore fitBounds error during unmount
      }
    }
  }, [map, bounds]);
  return null;
}

export default function LeafletMapInner({
  userLat,
  userLng,
  venueLat,
  venueLng,
  venueName,
  mode,
  route,
  fallbackMode,
  onModeChange,
}: LeafletMapInnerProps) {
  const userPos = new LatLng(userLat, userLng);
  const venuePos = new LatLng(venueLat, venueLng);

  return (
    <div className="mt-4 space-y-2.5 rounded-xl border border-border bg-card p-3.5 shadow-sm">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">Route Preview</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onModeChange?.("walking")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              mode === "walking"
                ? "bg-sky text-white shadow-xs"
                : "border border-border bg-background text-gray-text hover:text-ink",
            )}
          >
            🚶 Walking
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.("driving")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              mode === "driving"
                ? "bg-sky text-white shadow-xs"
                : "border border-border bg-background text-gray-text hover:text-ink",
            )}
          >
            🚗 Driving
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative h-60 overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={[userLat, userLng]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {/* Route line */}
          <Polyline
            positions={route.geometry}
            color={mode === "walking" ? "#0284c7" : "#2563eb"}
            weight={4}
            opacity={0.85}
            dashArray={fallbackMode ? "6, 8" : undefined}
            lineCap="round"
            lineJoin="round"
          />

          {/* User marker */}
          <Marker position={userPos} icon={userIcon}>
            <Popup>Your current location</Popup>
          </Marker>

          {/* Venue marker */}
          <Marker position={venuePos} icon={venueIcon}>
            <Popup>{venueName}</Popup>
          </Marker>

          {/* Auto-fit bounds */}
          <MapFit bounds={[userPos, venuePos]} />
        </MapContainer>

        {/* Floating ETA badge */}
        <div className="absolute top-2.5 left-2.5 z-[1000] rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-md backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">{mode === "walking" ? "🚶" : "🚗"}</span>
            <div className="flex flex-col">
              <div className="font-display text-xs font-bold text-ink">
                {route.durationMinutes} min{fallbackMode ? "*" : ""}
              </div>
              <div className="text-[11px] text-gray-text">{formatDistanceKm(route.distanceKm)}</div>
            </div>
          </div>
          {fallbackMode && (
            <div className="mt-0.5 text-[9px] text-gray-text">*estimated offline route</div>
          )}
        </div>
      </div>

      {/* Attribution note */}
      <div className="flex items-center justify-between text-[10px] text-gray-text">
        <span>Route to {venueName}</span>
        <span>Map © OpenStreetMap · OSRM</span>
      </div>
    </div>
  );
}
