import { Users } from "lucide-react";
import type { BalancedTeams } from "@/lib/teamBalance";
import { cn } from "@/lib/utils";

export function TeamRoster({ teams, compact }: { teams: BalancedTeams; compact?: boolean }) {
  const sides = [
    { label: "Team A", list: teams.a, avg: teams.avgA, accent: "text-sky" },
    { label: "Team B", list: teams.b, avg: teams.avgB, accent: "text-navy" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sides.map((t) => (
        <div key={t.label} className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <span className={cn("flex items-center gap-2 text-sm font-bold", t.accent)}>
              <Users size={15} /> {t.label}
            </span>
            <span className="text-xs font-semibold text-gray-text">avg {t.avg} Elo</span>
          </div>
          <ul className={cn("mt-3 space-y-1.5", compact && "space-y-1")}>
            {t.list.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className={cn(
                  "flex items-center justify-between gap-2 text-xs",
                  p.isMe ? "font-bold text-navy" : "text-gray-text",
                )}
              >
                <span className="truncate">{p.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                    {p.skill}
                  </span>
                  {p.elo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
