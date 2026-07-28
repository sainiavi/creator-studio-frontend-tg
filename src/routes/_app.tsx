import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/studio/Sidebar";
import { MobileNav } from "@/components/studio/MobileNav";
import { StudioPageBackground } from "@/components/studio/StudioPageBackground";
import { isPlayPath, rememberPlayReturnPath } from "@/lib/playNavigation";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();
  const isPlayPage = location.pathname.startsWith("/play");
  const prevLocationRef = useRef({
    pathname: location.pathname,
    search: typeof location.search === "string" ? location.search : "",
  });

  useEffect(() => {
    const prev = prevLocationRef.current;
    const currentSearch = typeof location.search === "string" ? location.search : "";
    if (isPlayPath(location.pathname) && !isPlayPath(prev.pathname)) {
      rememberPlayReturnPath(prev.pathname, prev.search);
    }
    prevLocationRef.current = { pathname: location.pathname, search: currentSearch };
  }, [location.pathname, location.search]);

  return (
    <div className="relative flex min-h-screen w-full">
      {!isPlayPage && <StudioPageBackground />}
      <Sidebar />
      <main
        className={`relative z-10 min-w-0 flex-1 ${
          isPlayPage ? "pb-0" : "pb-24 min-[1190px]:pb-0"
        }`}
      >
        <Outlet />
      </main>
      {!isPlayPage && <MobileNav />}
    </div>
  );
}
