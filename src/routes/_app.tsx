import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/studio/Sidebar";
import { MobileNav } from "@/components/studio/MobileNav";
import { StudioProvider } from "@/context/StudioContext";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <StudioProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-24 lg:pb-0">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </StudioProvider>
  );
}
