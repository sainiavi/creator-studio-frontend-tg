import { Link } from "@tanstack/react-router";
import { useStudioContext } from "@/context/StudioContext";
import { PrivyAccountControls } from "@/components/studio/PrivyAccountControls";
import {
  Home,
  Gamepad2,
  Wand2,
  Trophy,
  User,
  Grid3x3,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
} from "lucide-react";

const BROWSER_URL =
  import.meta.env.VITE_BROWSER_URL ?? "https://kult-browser-rust-l2lwg.ondigitalocean.app/";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/templates", label: "Templates", icon: Gamepad2 },
  { to: "/create", label: "Create", icon: Wand2 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/more", label: "More", icon: Grid3x3 },
] as const;

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useStudioContext();
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-violet-200/70 bg-[linear-gradient(180deg,#fff8ff,#f3e0ff)] py-6 md:flex transition-all duration-300 ease-in-out shadow-[2px_0_20px_rgba(168,85,247,0.06)] ${
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
              <span className="block text-violet-900">CREATOR</span>
              <span className="block text-gradient">STUDIO</span>
            </>
          )}
        </h1>
        {!collapsed && (
          <p className="label-mono mt-3 text-[10px] text-violet-500">Prompt to Playable Game</p>
        )}
      </Link>

      {/* Navigation */}
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className={`group flex items-center rounded-xl text-sm font-semibold text-violet-700 transition-all hover:bg-white/80 hover:text-violet-950 hover:shadow-[0_2px_8px_rgba(168,85,247,0.08)] ${
              collapsed ? "justify-center px-0 py-3" : "gap-4 px-4 py-3"
            }`}
            activeProps={{
              className:
                "bg-white/80 text-violet-950 shadow-[0_0_0_1px_rgba(168,85,247,0.2),0_4px_12px_rgba(124,58,237,0.1),inset_0_1px_6px_rgba(255,255,255,0.9)] shadow-[inset_3px_0_0_0_var(--color-primary)]",
            }}
            title={collapsed ? label : undefined}
          >
            <Icon className="size-5 shrink-0 transition-colors group-hover:text-primary" />
            {!collapsed && <span className="label-mono text-xs">{label}</span>}
          </Link>
        ))}
      </nav>

      <PrivyAccountControls collapsed={collapsed} />

      {/* Collapse toggle */}
      <div className={`flex ${collapsed ? "justify-center" : "justify-end px-2"}`}>
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="flex size-8 items-center justify-center rounded-lg border border-violet-200/70 bg-white/60 text-violet-500 transition-all hover:bg-white hover:text-violet-800 hover:border-violet-300 hover:shadow-[0_2px_8px_rgba(168,85,247,0.1)]"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      {/* External: back to the KULT browser app */}
      <a
        href={BROWSER_URL}
        className={`mt-3 flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#9d4dff] to-[#7a2ef0] text-white shadow-[0_4px_18px_rgba(140,59,255,0.35)] transition-all hover:from-[#a95fff] hover:to-[#8a3eff] ${
          collapsed ? "px-0 py-3" : "px-4 py-3"
        }`}
        title="Back To Browser"
      >
        {collapsed ? (
          <ArrowLeft className="size-5 shrink-0" />
        ) : (
          <span className="label-mono text-xs font-bold tracking-wider">BACK TO BROWSER</span>
        )}
      </a>
    </aside>
  );
}
