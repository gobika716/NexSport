import React, { useEffect, useState, Suspense } from "react";
import { haversineKm } from "@/hooks/use-geolocation";
import type { RouteData } from "./LeafletMapInner";

// Dynamically lazy-load Leaflet map only in browser to prevent SSR "window is not defined" error
const LazyLeafletMap = React.lazy(() => import("./LeafletMapInner"));

interface VenueRoutePreviewProps {
  userLat: number;
  userLng: number;
  venueLat: number;
  venueLng: number;
  venueName: string;
  mode?: "driving" | "walking";
  onModeChange?: (mode: "driving" | "walking") => void;
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
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch route from OSRM when coordinates or mode change
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchRoute() {
      setLoading(true);

      try {
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        // Fetch real road route geometry & distance from OSRM
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${venueLng},${venueLat}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Route not available");
        const data = await res.json();

        if (!data.routes || !data.routes[0]) throw new Error("No route found");

        const route0 = data.routes[0];
        const distKm = (route0.distance as number) / 1000;

        // Distinct realistic duration calculation:
        // Driving uses OSRM vehicle traffic duration (~30-40 km/h)
        // Walking uses standard pedestrian pace (~4.8 km/h = ~12.5 min/km)
        const durationMinutes =
          mode === "walking"
            ? Math.max(1, Math.round((distKm / 4.8) * 60))
            : Math.max(1, Math.round((route0.duration as number) / 60));

        if (active) {
          setRoute({
            distanceKm: distKm,
            durationMinutes,
            geometry: (route0.geometry.coordinates as Array<[number, number]>).map((c) => [
              c[1],
              c[0],
            ]),
          });
          setFallbackMode(false);
        }
      } catch {
        // Fallback: straight line + road curvature factor + haversine distance
        if (active) {
          const directDistKm = haversineKm(userLat, userLng, venueLat, venueLng);
          const distKm = Math.round(directDistKm * 1.25 * 10) / 10;
          const speedKmh = mode === "walking" ? 4.8 : 30;
          const durationMinutes = Math.max(1, Math.round((distKm / speedKmh) * 60));

          setRoute({
            distanceKm: distKm,
            durationMinutes,
            geometry: [
              [userLat, userLng],
              [venueLat, venueLng],
            ],
          });
          setFallbackMode(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchRoute();

    return () => {
      active = false;
      controller.abort();
    };
  }, [userLat, userLng, venueLat, venueLng, mode]);

  if (!isClient || !route || loading) {
    return (
      <div className="mt-4 flex h-60 items-center justify-center rounded-xl border border-border bg-secondary/30">
        <div className="flex items-center gap-2 text-xs text-gray-text">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky border-t-transparent" />
          Calculating route & map…
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="mt-4 flex h-60 items-center justify-center rounded-xl border border-border bg-secondary/30">
          <div className="flex items-center gap-2 text-xs text-gray-text">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky border-t-transparent" />
            Loading map…
          </div>
        </div>
      }
    >
      <LazyLeafletMap
        userLat={userLat}
        userLng={userLng}
        venueLat={venueLat}
        venueLng={venueLng}
        venueName={venueName}
        mode={mode}
        route={route}
        fallbackMode={fallbackMode}
        onModeChange={onModeChange}
      />
    </Suspense>
  );
}
