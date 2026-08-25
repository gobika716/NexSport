import { Mail, Phone, MapPin, Instagram, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/common/Button";

export function Footer({ onSignup }: { onSignup: () => void }) {
  return (
    <footer id="contact" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="card-soft grid grid-cols-1 items-center gap-6 bg-secondary/60 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Ready for your next fair game?
            </h2>
            <p className="mt-2 text-sm text-gray-text">
              Join 5,000+ players already matched on NexSport.
            </p>
          </div>
          <Button size="lg" onClick={onSignup} className="w-full sm:w-auto">
            Get started free
          </Button>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-10 sm:flex-row sm:items-start">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img
                src="/nexsport-logo.svg"
                alt="NexSport logo"
                width={156}
                height={48}
                className="h-10 w-[130px] shrink-0 rounded-xl object-cover sm:w-[156px]"
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-text">
              Find Players. Build Teams. Play Fair.
            </p>
            <div className="mt-5 flex gap-2">
              {[Instagram, Twitter, Youtube].map((SocialIcon, i) => (
                <a
                  key={i}
                  href="#contact"
                  aria-label="NexSport social profile"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border text-gray-text transition-colors hover:border-sky hover:text-sky"
                >
                  <SocialIcon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-ink">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-text">
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="mt-0.5 shrink-0 text-sky" />
                <span className="min-w-0 break-words">nexsport@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="mt-0.5 shrink-0 text-sky" />
                <span>xxxxxxx</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-sky" />
                <span>Perundurai, Erode</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-gray-text">
          © {new Date().getFullYear()} NexSport. Find players. Build teams. Play fair.
        </div>
      </div>
    </footer>
  );
}
