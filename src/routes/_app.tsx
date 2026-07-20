import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Sidebar } from "@/components/studio/Sidebar";
import { MobileNav } from "@/components/studio/MobileNav";
import { StudioPageBackground } from "@/components/studio/StudioPageBackground";
import { StudioProvider } from "@/context/StudioContext";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();
  const isPlayPage = location.pathname.startsWith("/play");

  return (
    <StudioProvider>
      <div className="relative flex min-h-screen w-full">
        {!isPlayPage && <StudioPageBackground />}
        <Sidebar />
        <main className={`relative z-10 flex-1 min-w-0 ${isPlayPage ? "pb-0" : "pb-24 md:pb-0"}`}>
          <Outlet />
        </main>
        {!isPlayPage && <MobileNav />}
      </div>
    </StudioProvider>
  );
}
