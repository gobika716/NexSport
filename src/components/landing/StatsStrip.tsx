import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { stats } from "@/data/sportsData";
import { Reveal } from "@/components/common/Reveal";

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
      <Reveal className="card-soft grid grid-cols-2 gap-6 p-8 sm:p-10 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.id} className="text-center">
            <p className="font-display text-3xl font-bold text-gradient-blue sm:text-4xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm font-medium text-gray-text">{s.label}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
