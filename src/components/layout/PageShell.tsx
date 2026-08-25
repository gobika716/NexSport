import { type ReactNode } from "react";
import { Toaster } from "sonner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AuthModal } from "@/components/modals/AuthModal";
import { useAuth } from "@/lib/auth";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20 lg:pt-36">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-navy uppercase">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-text">{subtitle}</p>
        </div>
        {children}
      </main>
      <Footer onSignup={() => auth.openAuth("signup")} />
      <AuthModal
        open={auth.authOpen}
        mode={auth.authMode}
        onClose={auth.closeAuth}
        onModeChange={auth.setAuthMode}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}
