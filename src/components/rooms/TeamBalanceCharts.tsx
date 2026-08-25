import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  eloSpread,
  skillDistribution,
  teamStrengthRadar,
  type BalancedTeams,
} from "@/lib/teamBalance";

const NAVY = "#0b2d5c";
const SKY = "#20b7f3";
const GRID = "#e2e8f0";
const AXIS = "#64748b";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
} as const;

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-xs font-bold text-ink">{title}</p>
      <p className="mt-0.5 text-[11px] text-gray-text">{hint}</p>
      <div className="mt-3 h-44">{children}</div>
    </div>
  );
}

export function TeamBalanceCharts({ teams }: { teams: BalancedTeams }) {
  const spread = eloSpread(teams);
  const dist = skillDistribution(teams);
  const radar = teamStrengthRadar(teams);
  const minElo = Math.min(...spread.flatMap((r) => [r["Team A"], r["Team B"]].filter(Boolean)));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel title="Rating ladder" hint="Zig-zag pairs each pick with its mirror slot">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spread} margin={{ left: -26, right: 4, top: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} vertical={false} />
            <XAxis dataKey="slot" tickLine={false} axisLine={false} fontSize={11} stroke={AXIS} />
            <YAxis
              domain={[Math.max(800, minElo - 80), "dataMax + 60"]}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke={AXIS}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef2f7" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Team A" fill={SKY} radius={[5, 5, 0, 0]} />
            <Bar dataKey="Team B" fill={NAVY} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Skill band spread" hint="How many players sit in each band per side">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dist} margin={{ left: -26, right: 4, top: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} vertical={false} />
            <XAxis dataKey="band" tickLine={false} axisLine={false} fontSize={10} stroke={AXIS} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke={AXIS}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef2f7" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Team A" stackId="s" fill={SKY} />
            <Bar dataKey="Team B" stackId="s" fill={NAVY} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Strength profile" hint="Top end, depth, average and consistency">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radar} outerRadius="72%">
            <PolarGrid stroke={GRID} />
            <PolarAngleAxis dataKey="attribute" fontSize={10} stroke={AXIS} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Team A" dataKey="Team A" stroke={SKY} fill={SKY} fillOpacity={0.3} />
            <Radar name="Team B" dataKey="Team B" stroke={NAVY} fill={NAVY} fillOpacity={0.18} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="rounded-2xl border border-border p-4">
        <p className="text-xs font-bold text-ink">Why this is fair</p>
        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-gray-text">
          <li>
            <span className="font-bold text-ink">Average gap:</span> {teams.gap} Elo between sides
            (threshold 60).
          </li>
          <li>
            <span className="font-bold text-ink">Serpentine draft:</span> picks run 1-2-2-1 so the
            top two players never land on the same side.
          </li>
          <li>
            <span className="font-bold text-ink">Band mirroring:</span> each skill band is split as
            evenly as the roster allows.
          </li>
        </ul>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-text">
            <span>Fairness score</span>
            <span className="text-ink">{teams.fairness}/100</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="gradient-blue h-full rounded-full transition-all duration-700"
              style={{ width: `${teams.fairness}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
