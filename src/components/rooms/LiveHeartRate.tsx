import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Bluetooth, Loader2 } from "lucide-react";
import { useHeartRate } from "@/hooks/use-heart-rate";
import { listRoomMetricsFn, recordMetricsFn } from "@/server/metrics";
import { cn } from "@/lib/utils";

interface LiveHeartRateProps {
  roomId: string;
  userId?: string | undefined;
}

/**
 * Live heart-rate widget for a room. Uses the Web Bluetooth heart-rate hook
 * (POLAR / JioHeartGuard-style BLE) and streams readings to the server via
 * recordMetricsFn. Shows the latest reading from the room's live metrics.
 */
export function LiveHeartRate({ roomId, userId }: LiveHeartRateProps) {
  const { bpm, status, error, supported, start, stop, isStreaming } = useHeartRate();
  const [lastSent, setLastSent] = useState<number | null>(null);

  // Poll the room's latest metrics so other players' HR shows up.
  const { data: metrics = [] } = useQuery({
    queryKey: ["metrics", roomId],
    queryFn: () => listRoomMetricsFn({ data: { roomId } }),
    refetchInterval: 5000,
  });

  // Stream the local BPM to the server when available.
  useEffect(() => {
    if (!bpm || !userId || lastSent === bpm) return;
    setLastSent(bpm);
    void recordMetricsFn({
      data: {
        userId,
        roomId,
        heartRate: bpm,
        steps: 0,
        calories: 0,
        distanceM: 0,
        speed: 0,
      },
    }).catch(() => {});
  }, [bpm, userId, roomId, lastSent]);

  const latest = metrics[0];

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold text-ink">
          <HeartPulse size={15} className="text-destructive" /> Live heart rate
        </p>
        {supported ? (
          <button
            onClick={isStreaming ? stop : start}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
              isStreaming
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-navy hover:bg-sky/15",
            )}
          >
            {isStreaming ? (
              <>
                <HeartPulse size={12} /> Stop
              </>
            ) : status === "connecting" ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Connecting
              </>
            ) : (
              <>
                <Bluetooth size={12} /> Pair monitor
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] text-gray-text">Web Bluetooth unsupported</span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span
          className={cn(
            "font-display text-4xl font-bold",
            isStreaming ? "text-destructive" : "text-ink",
          )}
        >
          {isStreaming && bpm ? bpm : (latest?.heartRate ?? "--")}
        </span>
        <span className="pb-1 text-xs font-semibold text-gray-text">bpm</span>
      </div>

      <p className="mt-2 text-xs text-gray-text">
        {isStreaming
          ? "Streaming live from your monitor."
          : latest
            ? "Latest reading in this room."
            : "Pair a Bluetooth heart-rate monitor to stream live."}
      </p>

      {error ? (
        <p className="mt-2 rounded-lg bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
