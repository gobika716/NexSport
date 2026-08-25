import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/", hash: "features", label: "Features", protected: false },
  { to: "/", hash: "sports", label: "Sports", protected: false },
  { to: "/", hash: "how-it-works", label: "How It Works", protected: false },
  { to: "/rooms", label: "Match Rooms", protected: true },
  { to: "/leaderboard", label: "Leaderboard", protected: true },
  { to: "/dashboard", label: "Dashboard", protected: true },
  { to: "/profile", label: "Profile", protected: true },
] as const;

const linkClass =
  "text-sm font-medium text-gray-text transition-colors hover:text-sky data-[status=active]:text-sky";

export function Navbar() {
  const auth = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Only show protected links (Match Rooms, Leaderboard, Dashboard, Profile)
  // after the user has logged in. Public links are always visible.
  const visibleLinks = auth.isAuthenticated ? links : links.filter((l) => !l.protected);

  const handleNavigation = (to: string, isProtected: boolean) => {
    if (!isProtected) {
      router.navigate({ to });
      return;
    }

    if (auth.isAuthenticated) {
      router.navigate({ to });
      return;
    }

    auth.setRedirectPath(to);
    auth.openAuth("login");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border/70 bg-background/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/nexsport-logo.svg"
            alt="NexSport logo"
            width={156}
            height={48}
            className="h-10 w-[130px] shrink-0 rounded-xl object-cover sm:w-[156px]"
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-6">
            {visibleLinks.map((l) => (
              <li key={l.label}>
                {l.protected ? (
                  <button
                    type="button"
                    onClick={() => handleNavigation(l.to, true)}
                    className={cn(linkClass, "bg-transparent border-none p-0 text-left")}
                  >
                    {l.label}
                  </button>
                ) : (
                  <Link to={l.to} {...("hash" in l ? { hash: l.hash } : {})} className={linkClass}>
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            {auth.user ? (
              <>
                <span className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-navy">
                  Hi, {auth.user.name}
                </span>
                <Button variant="secondary" onClick={auth.logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => auth.openAuth("login")}>
                  Login
                </Button>
                <Button onClick={() => auth.openAuth("signup")}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-1 px-5 py-4">
              {visibleLinks.map((l) => (
                <button
                  key={l.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleNavigation(l.to, Boolean(l.protected));
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-text hover:bg-secondary hover:text-ink"
                >
                  {l.label}
                </button>
              ))}
              <div
                className={
                  auth.user ? "grid grid-cols-1 gap-3 pt-3" : "grid grid-cols-2 gap-3 pt-3"
                }
              >
                {auth.user ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpen(false);
                      auth.logout();
                    }}
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setOpen(false);
                        auth.openAuth("login");
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => {
                        setOpen(false);
                        auth.openAuth("signup");
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
