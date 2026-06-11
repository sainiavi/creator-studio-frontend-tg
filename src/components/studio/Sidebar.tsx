import { Link } from "@tanstack/react-router";
import { useStudioContext } from "@/context/StudioContext";
import {
  Home,
  Gamepad2,
  Wand2,
  Sparkles,
  Trophy,
  User,
  LogIn,
  Grid3x3,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
} from "lucide-react";

export const BROWSER_URL =
  import.meta.env.VITE_BROWSER_URL ?? "https://kult-browser-rust-l2lwg.ondigitalocean.app/";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/templates", label: "Templates", icon: Gamepad2 },
  { to: "/create", label: "Create", icon: Wand2 },
  { to: "/studio", label: "Studio", icon: Sparkles },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/more", label: "More", icon: Grid3x3 },
] as const;

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useStudioContext();
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-6 lg:flex transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px] px-2" : "w-64 px-4"
      }`}
    >
      {/* Logo */}
      <Link to="/" className={`mb-1 block ${collapsed ? "px-0 text-center" : "px-2"}`}>
        <h1 className="font-display text-2xl font-black leading-none tracking-tight">
          {collapsed ? (
            <span className="block text-gradient text-lg">CS</span>
          ) : (
            <>
              <span className="block text-sidebar-foreground">CREATOR</span>
              <span className="block text-gradient">STUDIO</span>
            </>
          )}
        </h1>
        {!collapsed && (
          <p className="label-mono mt-3 text-[10px] text-muted-foreground">
            Prompt to Playable Game
          </p>
        )}
      </Link>

      {/* Navigation */}
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className={`group flex items-center rounded-xl text-sm font-semibold text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground ${
              collapsed
                ? "justify-center px-0 py-3"
                : "gap-4 px-4 py-3"
            }`}
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-foreground shadow-[inset_3px_0_0_0_var(--color-primary)]",
            }}
            title={collapsed ? label : undefined}
          >
            <Icon className="size-5 shrink-0 transition-colors group-hover:text-primary" />
            {!collapsed && (
              <span className="label-mono text-xs">{label}</span>
            )}
          </Link>
        ))}

        {/* External: back to the KULT browser app */}
        <a
          href={BROWSER_URL}
          className={`group flex items-center rounded-xl text-sm font-semibold text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground ${
            collapsed ? "justify-center px-0 py-3" : "gap-4 px-4 py-3"
          }`}
          title={collapsed ? "Back To Browser" : undefined}
        >
          <ArrowLeft className="size-5 shrink-0 transition-colors group-hover:text-primary" />
          {!collapsed && <span className="label-mono text-xs">Back To Browser</span>}
        </a>
      </nav>

      {/* Collapse toggle */}
      <div className={`mt-4 flex ${collapsed ? "justify-center" : "justify-end px-2"}`}>
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="flex size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/50 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-primary/40"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>

      {/* Version */}
      {!collapsed && (
        <div className="label-mono mt-3 px-2 text-[10px] text-muted-foreground/60">
          v1.0 · Kult Build Console
        </div>
      )}
    </aside>
  );
}