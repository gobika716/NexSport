import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { AboutSection } from "@/components/landing/AboutSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PopularSports } from "@/components/landing/PopularSports";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AlgorithmCards } from "@/components/landing/AlgorithmCards";
import { AiSection } from "@/components/landing/AiSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";
import { AuthModal } from "@/components/modals/AuthModal";
import { CreateMatchModal } from "@/components/modals/CreateMatchModal";
import { useAuth } from "@/lib/auth";

const title = "NexSport — Find Players. Build Teams. Play Fair.";
const description =
  "NexSport connects sports enthusiasts through intelligent matchmaking, balanced team formation and performance tracking across 12 community sports.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const auth = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection onCreateMatch={() => setMatchOpen(true)} />
        <StatsStrip />
        <AboutSection />
        <FeaturesGrid />
        <PopularSports />
        <HowItWorks />
        <AlgorithmCards />
        <AiSection />
        <Testimonials />
      </main>
      <Footer onSignup={() => auth.openAuth("signup")} />

      <AuthModal
        open={auth.authOpen}
        mode={auth.authMode}
        onClose={auth.closeAuth}
        onModeChange={auth.setAuthMode}
      />
      <CreateMatchModal open={matchOpen} onClose={() => setMatchOpen(false)} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
