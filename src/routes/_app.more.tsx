import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { Settings, Bell, Shield, HelpCircle, Palette, Users, FileText, LogIn, ChevronRight, ArrowLeft } from "lucide-react";
import { BROWSER_URL } from "@/components/studio/Sidebar";

export const Route = createFileRoute("/_app/more")({
  head: () => ({
    meta: [
      { title: "More — Creator Studio" },
      { name: "description", content: "Settings, community, help and more options for your creator account." },
    ],
  }),
  component: More,
});

const groups = [
  {
    title: "Account",
    items: [
      { icon: Settings, label: "Settings", to: "/more" },
      { icon: Bell, label: "Notifications", to: "/more" },
      { icon: Shield, label: "Privacy & Security", to: "/more" },
    ],
  },
  {
    title: "Studio",
    items: [
      { icon: Palette, label: "Appearance", to: "/more" },
      { icon: Users, label: "Community", to: "/leaderboard" },
      { icon: FileText, label: "Templates", to: "/templates" },
      { icon: HelpCircle, label: "Help & Support", to: "/more" },
    ],
  },
];

function More() {
  return (
    <div>
      <PageHeader title="More" subtitle="Settings · Community · Support · Everything else" />
      <div className="mx-auto max-w-2xl px-6 py-8 lg:px-10">
        {groups.map((group, gi) => (
          <div key={group.title} className="mb-8">
            <h2 className="label-mono mb-3 text-[11px] text-muted-foreground">{group.title}</h2>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
              {group.items.map((item, i) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="animate-float-up flex items-center gap-4 border-b border-border/40 px-5 py-4 transition-colors last:border-0 hover:bg-secondary"
                  style={{ animationDelay: `${(gi * 4 + i) * 40}ms`, opacity: 0 }}
                >
                  <item.icon className="size-5 text-primary" />
                  <span className="flex-1 text-sm font-semibold">{item.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <a
          href={BROWSER_URL}
          className="animate-float-up flex items-center gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-card transition-colors hover:bg-secondary"
          style={{ animationDelay: "320ms", opacity: 0 }}
        >
          <ArrowLeft className="size-5 text-primary" />
          <span className="flex-1 text-sm font-semibold">Back To Browser</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}