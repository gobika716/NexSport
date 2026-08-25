import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/testimonialData";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Players who stopped chasing games"
          subtitle="Organisers and regulars using NexSport every week."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <article className="card-soft flex h-full flex-col p-7 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <Quote size={26} className="text-sky/40" />
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={15}
                      className={idx < t.rating ? "fill-lime text-lime" : "text-border"}
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink">"{t.quote}"</p>
                <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border pt-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full gradient-blue font-display text-sm font-bold text-white">
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
                    <p className="truncate text-xs text-gray-text">
                      {t.role} · {t.sport}
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
