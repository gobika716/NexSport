import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ModalShell } from "./ModalShell";
import { Button } from "@/components/common/Button";
import { matchSports, skillBands } from "@/data/mockMatches";

interface MatchValues {
  sport: string;
  venue: string;
  date: string;
  players: number;
  skill: string;
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MatchValues>({
    defaultValues: {
      sport: "Badminton",
      players: 4,
      skill: "Open (all levels)",
    },
  });

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

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Venue</label>
          <input
            className={fieldClass}
            placeholder="Sunrise Sports Arena"
            {...register("venue", { required: "Venue is required" })}
          />
          {errors.venue ? (
            <p className="mt-1 text-xs text-destructive">{errors.venue.message}</p>
          ) : null}
        </div>

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
