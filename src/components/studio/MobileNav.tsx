import { Link } from "@tanstack/react-router";
import { Home, Gamepad2, Wand2, Sparkles, Trophy, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/templates", label: "Templates", icon: Gamepad2 },
  { to: "/create", label: "Create", icon: Wand2 },
  { to: "/studio", label: "Studio", icon: Sparkles },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-sidebar-border bg-sidebar/95 px-2 py-2 backdrop-blur lg:hidden">
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          className="flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-muted-foreground"
          activeProps={{ className: "text-primary" }}
        >
          <Icon className="size-5" />
          <span className="label-mono text-[9px]">{label}</span>
        </Link>
      ))}
    </nav>
  );
}