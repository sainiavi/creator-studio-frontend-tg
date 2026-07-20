import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Plus, Trophy, UserRound } from "lucide-react";

const sideItems = [
  { to: "/", label: "Discover", Icon: Home, exact: true },
  { to: "/templates", label: "Templates", Icon: LayoutGrid, exact: false },
] as const;

const endItems = [
  { to: "/leaderboard", label: "Ranks", Icon: Trophy, exact: false },
  { to: "/profile", label: "Profile", Icon: UserRound, exact: false },
] as const;

const barColor = "#160b2e";

function NavItem({
  to,
  label,
  Icon,
  exact,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  exact: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-1 py-2 text-[#d4cce8] transition"
      activeProps={{
        className: "text-white",
      }}
    >
      <Icon className="size-[22px]" strokeWidth={2.15} aria-hidden="true" />
      <span className="text-[10px] font-semibold leading-none tracking-wide">{label}</span>
    </Link>
  );
}

export function MobileNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="pointer-events-auto relative overflow-visible pt-8">
        <nav
          className="relative border-t border-violet-400/25 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(88,28,135,0.35)]"
          style={{ backgroundColor: barColor }}
        >
          <div className="flex h-[62px] items-stretch">
            {sideItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}

            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <Link
                to="/create"
                aria-label="Create"
                className="absolute bottom-[34px] left-1/2 z-30 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#a855f7] text-white shadow-[0_0_0_5px_#160b2e,0_8px_24px_rgba(168,85,247,0.65)]"
              >
                <Plus className="size-7" strokeWidth={3} aria-hidden="true" />
              </Link>
            </div>

            {endItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
