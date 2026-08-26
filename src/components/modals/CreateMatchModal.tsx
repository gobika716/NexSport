import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Navigation, AlertCircle } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { Button } from "@/components/common/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { VenueRoutePreview } from "./VenueRoutePreview";
import { matchSports, skillBands } from "@/data/mockMatches";
import { listVenuesFn } from "@/server/venues";
import { useGeolocation } from "@/hooks/use-geolocation";
import { cn } from "@/lib/utils";
import type { Venue } from "@/db/schema";

export interface MatchValues {
  sport: string;
  venue: string;
  date: string;
  players: number;
  skill: string;
  venueId?: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
}

const fieldClass =
  "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-ink outline-none transition-colors placeholder:text-gray-text focus:border-sky";

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
  const [dismissedLocationPrompt, setDismissedLocationPrompt] = useState(false);

  const {
    position: userPosition,
    status: geoStatus,
    start: startGeo,
    stop: stopGeo,
  } = useGeolocation({
    autoStart: false,
  });

  // Stop geolocation watch when modal closes
  useEffect(() => {
    if (!open) {
      stopGeo();
      setDismissedLocationPrompt(false);
    }
  }, [open, stopGeo]);

  // Fetch active directory venues when modal is open and not in manual mode
  const { data: venues = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: () => listVenuesFn(),
    enabled: open && !manualEntry,
  });

  const {
    register,
    handleSubmit,
    reset,
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

  const handleVenueSelect = (venue: Venue) => {
    setValue("venue", venue.name, { shouldValidate: true });
    setValue("venueId", venue.id);
    setValue("venueLat", venue.lat ?? null);
    setValue("venueLng", venue.lng ?? null);
    setSelectedVenue(venue);
    setPopoverOpen(false);
    setDismissedLocationPrompt(false);
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
    setValue("venue", "", { shouldValidate: false });
    setSelectedVenue(null);
    setValue("venueId", null);
    setValue("venueLat", null);
    setValue("venueLng", null);
  };

  const handleStartLocation = () => {
    startGeo();
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
      setManualEntry(false);
      setSelectedVenue(null);
      stopGeo();
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

        {/* Venue Dropdown or Manual Input */}
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
                      "flex items-center justify-between text-left",
                      !selectedVenue && "text-gray-text",
                    )}
                  >
                    <span className="truncate">
                      {selectedVenue ? selectedVenue.name : "Search venues…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-[200] w-[--radix-popover-trigger-width] rounded-xl border border-border bg-card p-0 shadow-2xl"
                  align="start"
                  sideOffset={6}
                >
                  <Command className="bg-card">
                    <CommandInput placeholder="Search by name or area…" />
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty>No venue found.</CommandEmpty>
                      <CommandGroup heading="Available Venues">
                        {venues.map((v) => (
                          <CommandItem
                            key={v.id}
                            value={`${v.name} ${v.area} ${v.address}`}
                            onSelect={() => handleVenueSelect(v)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                selectedVenue?.id === v.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex-1 overflow-hidden">
                              <div className="truncate font-medium text-ink">{v.name}</div>
                              <div className="truncate text-xs text-gray-text">{v.area}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Other">
                        <CommandItem onSelect={handleManualEntry} className="cursor-pointer">
                          <div className="text-xs font-semibold text-sky">
                            Can't find your venue? Enter manually
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <input
                type="hidden"
                {...register("venue", { required: "Please select or enter a venue" })}
              />

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

        {/* Location Permission Card: shown only when directory venue is chosen and permission not yet granted */}
        {selectedVenue && !manualEntry && !dismissedLocationPrompt && geoStatus !== "granted" && (
          <div className="rounded-xl border border-sky/20 bg-sky/5 p-3.5">
            {geoStatus === "idle" && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-ink">
                  Show me the route to {selectedVenue.name}?
                </p>
                <p className="text-xs text-gray-text">
                  We'll use your location to calculate distance and travel time.
                </p>
                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={handleStartLocation}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                  >
                    <Navigation size={13} />
                    Use my location
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedLocationPrompt(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-gray-text transition-colors hover:text-ink"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}

            {geoStatus === "locating" && (
              <div className="flex items-center gap-2 text-xs text-gray-text">
                <div className="h-3 w-3 animate-pulse rounded-full bg-sky" />
                Finding your location…
              </div>
            )}

            {geoStatus === "denied" && (
              <div className="flex items-start gap-2 text-xs text-gray-text">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
                <span>
                  Location permission was denied. You can still publish the match without the live
                  route map.
                </span>
              </div>
            )}

            {(geoStatus === "error" || geoStatus === "unsupported") && (
              <div className="flex items-start gap-2 text-xs text-gray-text">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
                <span>Location unavailable. You can still publish the match normally.</span>
              </div>
            )}
          </div>
        )}

        {/* Live Route Map Preview: rendered when location is granted and coordinates are present */}
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

        {/* Friendly notice if selected venue has no geocoded coordinates */}
        {selectedVenue &&
          !manualEntry &&
          geoStatus === "granted" &&
          userPosition &&
          (selectedVenue.lat == null || selectedVenue.lng == null) && (
            <div className="rounded-xl bg-secondary/40 p-3 text-center">
              <p className="text-xs text-gray-text">
                Live route map isn't available for this venue yet.
              </p>
            </div>
          )}

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
