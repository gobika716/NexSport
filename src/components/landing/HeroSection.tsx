import { motion } from "motion/react";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import heroImage from "@/assets/hero-illustration.jpg";

export function HeroSection({ onCreateMatch }: { onCreateMatch: () => void }) {
  return (
    <section id="home" className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-sky/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 -left-40 h-[460px] w-[460px] rounded-full bg-lime/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-navy shadow-[var(--shadow-soft)]"
          >
            <ShieldCheck size={14} className="text-lime" />
            Fair play, powered by ratings
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-4xl leading-[1.08] font-bold text-ink sm:text-5xl lg:text-6xl"
          >
            Find Players.
            <br />
            Build Teams.
            <br />
            <span className="text-gradient-blue">Play Fair.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-gray-text sm:text-lg"
          >
            NexSport connects sports enthusiasts through intelligent matchmaking, balanced team
            formation and performance tracking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Button size="lg" onClick={onCreateMatch}>
              Create Match
              <ArrowRight size={18} />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                document.getElementById("sports")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Sports
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[var(--shadow-lift)]">
            <img
              src={heroImage}
              alt="NexSport balanced team formation with player skill ratings"
              width={1200}
              height={1008}
              className="h-auto w-full"
            />
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 left-2 flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-3 shadow-[var(--shadow-lift)] sm:left-6"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime/15 text-navy">
              <MapPin size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">Match nearby</p>
              <p className="truncate text-xs text-gray-text">4 players ready · 1.4 km away</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
