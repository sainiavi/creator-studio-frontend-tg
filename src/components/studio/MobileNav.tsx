import { Link } from "@tanstack/react-router";
import { Home, Gamepad2, Wand2, Globe2, Trophy, User } from "lucide-react";
import { BROWSER_URL } from "@/components/studio/Sidebar";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/templates", label: "Templates", icon: Gamepad2 },
  { to: "/create", label: "Create", icon: Wand2 },
  { href: BROWSER_URL, label: "Browser", icon: Globe2 },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-sidebar-border bg-sidebar/95 px-2 py-2 backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        if ("href" in item) {
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-muted-foreground"
            >
              <Icon className="size-5" />
              <span className="label-mono text-[9px]">{item.label}</span>
            </a>
          );
        }

        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-5" />
            <span className="label-mono text-[9px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
