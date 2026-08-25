import { useState } from "react";
import { MapPin, Compass, Trophy, Users, Clock } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import type { RoomDTO } from "@/server/rooms";

interface VenueMapProps {
  rooms: RoomDTO[];
  selectedRoomId?: string;
  onSelectRoom?: (roomId: string) => void;
  className?: string;
}

export function VenueMap({ rooms, selectedRoomId, onSelectRoom, className }: VenueMapProps) {
  const [activeId, setActiveId] = useState<string | null>(selectedRoomId ?? rooms[0]?.id ?? null);
  const activeRoom = rooms.find((room) => room.id === activeId) ?? rooms[0];
  const getPosition = (lat: number | null, lng: number | null, index: number) => {
    if (lat && lng)
      return {
        top: `${Math.min(85, Math.max(15, 50 - (lat - 12.9716) * 180))}%`,
        left: `${Math.min(85, Math.max(15, 50 + (lng - 77.5946) * 180))}%`,
      };
    const positions = [
      { top: "28%", left: "32%" },
      { top: "45%", left: "68%" },
      { top: "65%", left: "25%" },
      { top: "35%", left: "80%" },
      { top: "72%", left: "58%" },
    ];
    return positions[index % positions.length];
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-navy/95 text-white shadow-xl",
        className,
      )}
    >
      <div className="relative h-96 w-full bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] sm:h-[450px]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/40" />
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-navy/80 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md">
          <Compass size={15} className="text-sky" />
          <span>Interactive Venue Radar ({rooms.length} Active Courts)</span>
        </div>
        {rooms.map((room, index) => {
          const isSelected = room.id === activeId;
          return (
            <div
              key={room.id}
              style={getPosition(room.lat, room.lng, index)}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveId(room.id);
                  onSelectRoom?.(room.id);
                }}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg transition-all",
                  isSelected
                    ? "z-30 scale-110 bg-lime text-navy ring-4 ring-lime/30"
                    : "bg-white/15 text-white backdrop-blur-md hover:scale-105 hover:bg-sky hover:text-navy",
                )}
              >
                <MapPin size={15} />
                <span className="max-w-[110px] truncate">{room.venue.split(" ")[0]}</span>
                <span className="rounded-full bg-navy/30 px-1.5 py-0.5 text-[10px]">
                  {room.sport}
                </span>
              </button>
            </div>
          );
        })}
        {activeRoom ? (
          <div className="absolute right-4 bottom-4 left-4 z-30 rounded-2xl border border-white/15 bg-navy/90 p-4 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-6 sm:max-w-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky/20 px-2.5 py-0.5 text-xs font-bold text-sky">
                  <Trophy size={13} /> {activeRoom.sport} · {activeRoom.skill}
                </span>
                <h3 className="mt-1.5 font-display text-base font-bold text-white">
                  {activeRoom.venue}
                </h3>
                <p className="text-xs text-white/70">
                  {activeRoom.city} · ~{activeRoom.distanceKm} km away
                </p>
              </div>
              <div className="text-right">
                <span className="block text-xs font-semibold text-lime">
                  {activeRoom.filled}/{activeRoom.slots} Joined
                </span>
                <span className="text-[11px] text-white/60">Avg Elo {activeRoom.avgElo}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-sky" /> {activeRoom.time}
              </span>
              <span className="flex items-center gap-1">
                <Users size={13} className="text-lime" /> Host: {activeRoom.host}
              </span>
              {onSelectRoom ? (
                <Button size="sm" onClick={() => onSelectRoom(activeRoom.id)} className="ml-auto">
                  View Game
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
