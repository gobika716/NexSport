import { useState } from "react";
import { motion } from "motion/react";
import { sports, sportFilters } from "@/data/sportsData";
import { SectionHeading } from "@/components/common/SectionHeading";
import { cn } from "@/lib/utils";

export function PopularSports() {
  const [filter, setFilter] = useState<string>("all");
  const visible = sports.filter((s) => filter === "all" || s.group === filter);

  return (
    <section id="sports" className="bg-secondary/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Popular Sports"
          title="Twelve sports, one community"
          subtitle="From turf football to Sunday chess ladders — pick your game and find people playing it tonight."
        />

        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {sportFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                filter === f.id
                  ? "gradient-blue text-white shadow-[var(--shadow-soft)]"
                  : "border border-border bg-card text-gray-text hover:text-sky",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((s, i) => (
            <motion.article
              key={s.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              className="group relative overflow-hidden rounded-[20px] border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="relative aspect-4/3 overflow-hidden">
                <img
                  src={s.image}
                  alt={`${s.name} on NexSport`}
                  loading="lazy"
                  width={640}
                  height={640}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy/80 via-navy/10 to-transparent" />
                {s.badge ? (
                  <span className="absolute top-3 left-3 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-navy">
                    {s.badge}
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-lg font-semibold text-white">{s.name}</h3>
                  <p className="text-xs text-white/75">{s.players}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
