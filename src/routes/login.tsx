import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthModal } from "@/components/modals/AuthModal";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — NexSport" }] }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.ready && auth.isAuthenticated) router.navigate({ to: "/dashboard" });
  }, [auth.ready, auth.isAuthenticated, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <AuthModal
        open={!auth.isAuthenticated}
        mode="login"
        onClose={() => router.navigate({ to: "/" })}
        onModeChange={(mode) => {
          if (mode === "signup") router.navigate({ to: "/" });
        }}
      />
    </div>
  );
}
