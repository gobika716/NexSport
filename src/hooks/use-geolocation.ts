import { useCallback, useEffect, useRef, useState } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number;
}

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unsupported" | "error";

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /** Auto-start capturing position on mount. */
  autoStart?: boolean;
}

/**
 * Real GPS hook using the browser Geolocation API.
 * Returns the user's live position, status, an error message, and controls.
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0, autoStart = true } = options;

  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const stop = useCallback(() => {
    if (watchId.current !== null && supported) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, [supported]);

  const start = useCallback(() => {
    if (!supported) {
      setStatus("unsupported");
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setStatus("locating");
    setError(null);

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        timestamp: pos.timestamp,
      });
      setStatus("granted");
      setError(null);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    };

    // One-shot attempt for a quick fix, then keep watching for movement.
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [supported, enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  return { position, status, error, supported, start, stop };
}

/** Haversine distance in km between two lat/lng points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format a km distance for display. */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
