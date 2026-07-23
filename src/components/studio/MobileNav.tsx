import { Link, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import navHomeIcon from "@/assets/navHome.webp";
import navTemplatesIcon from "@/assets/navTemplates.webp";
import navRanksIcon from "@/assets/navRanks.webp";
import navProfileIcon from "@/assets/navProfile.webp";

const sideItems = [
  { to: "/", label: "Discover", iconSrc: navHomeIcon, exact: true },
  { to: "/templates", label: "Templates", iconSrc: navTemplatesIcon, exact: false },
] as const;

const endItems = [
  { to: "/leaderboard", label: "Ranks", iconSrc: navRanksIcon, exact: false },
  { to: "/profile", label: "Profile", iconSrc: navProfileIcon, exact: false },
] as const;

export const MOBILE_BAR_COLOR = "#160b2e";
const barColor = MOBILE_BAR_COLOR;

function NavItem({
  to,
  label,
  iconSrc,
  exact,
}: {
  to: string;
  label: string;
  iconSrc: string;
  exact: boolean;
}) {
  const location = useLocation();
  const selected = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition ${
        selected ? "text-white" : "text-[#d4cce8]"
      }`}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="size-8 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
      />
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
          <div className="flex h-[68px] items-stretch">
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
