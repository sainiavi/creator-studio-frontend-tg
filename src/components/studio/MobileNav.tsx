import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, PlusCircle, Trophy, UserRound } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/templates", label: "Templates", Icon: LayoutGrid },
  { to: "/create", label: "Create", Icon: PlusCircle },
  { to: "/leaderboard", label: "Ranks", Icon: Trophy },
  { to: "/profile", label: "Profile", Icon: UserRound },
] as const;

export function MobileNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 overflow-hidden px-2 pb-2 pt-3 md:hidden">
      <div className="absolute inset-0 -z-10 bg-white/18" />
      <nav className="flex items-center justify-around rounded-[2rem] border-2 border-violet-300/70 bg-[linear-gradient(180deg,#fff7ff,#f1ddff)] px-2 py-2 shadow-[0_0_0_2px_rgba(255,255,255,0.72),0_0_24px_rgba(168,85,247,0.48),inset_0_2px_12px_rgba(255,255,255,0.9)] backdrop-blur">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-1 text-violet-800 transition"
            activeProps={{
              className:
                "bg-white/80 text-violet-950 shadow-[0_0_0_1px_rgba(168,85,247,0.38),0_6px_16px_rgba(124,58,237,0.28),inset_0_1px_8px_rgba(255,255,255,0.95)]",
            }}
          >
            <Icon
              className="size-7 drop-shadow-[0_3px_6px_rgba(124,58,237,0.28)]"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <span className="text-[11px] font-black leading-none">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
