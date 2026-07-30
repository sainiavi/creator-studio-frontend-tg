import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LayoutDashboard, Search, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KultLogo } from "@/components/studio/KultLogo";
import { TonWalletSignInButton } from "@/components/studio/TonWalletSignInButton";
import { getCurrentUserId } from "@/lib/identity";
import {
  fetchNotifications,
  fetchPointSummary,
  markNotificationsRead,
  type NotificationItem,
} from "@/lib/api/social";

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function AppHeader({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [kultPoints, setKultPoints] = useState(0);
  const [kpLevel, setKpLevel] = useState(1);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const refresh = () => {
      fetchNotifications(userId)
        .then((data) => setNotifications(data.notifications))
        .catch(() => setNotifications([]));
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetchPointSummary(userId)
      .then((summary) => {
        setKultPoints(summary.kultPoints ?? summary.lifetimePoints ?? 0);
        setKpLevel(summary.level?.level ?? 1);
      })
      .catch(() => {});
  }, []);

  const openNotifications = async () => {
    setNotificationsOpen(true);
    const userId = getCurrentUserId();
    if (!userId) return;
    const data = await fetchNotifications(userId).catch(() => null);
    if (data) setNotifications(data.notifications);
    await markNotificationsRead(userId).catch(() => null);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const openNotificationTarget = (notification: NotificationItem) => {
    if (!notification.gameId) return;
    setNotificationsOpen(false);
    navigate({ to: "/play", search: { gameId: notification.gameId } });
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 box-border flex min-h-[56px] w-[100dvw] max-w-[100dvw] items-center justify-between gap-3 overflow-hidden border-b border-fuchsia-300/20 bg-[#0b0419]/90 px-3 py-2.5 text-white shadow-[0_10px_30px_rgba(8,4,20,0.5),0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl min-[1190px]:mx-3 min-[1190px]:mt-3 min-[1190px]:min-h-16 min-[1190px]:w-auto min-[1190px]:max-w-none min-[1190px]:rounded-[1.5rem] min-[1190px]:border min-[1190px]:border-fuchsia-200/45 min-[1190px]:bg-[#100528]/88 min-[1190px]:px-6 min-[1190px]:py-3 min-[1190px]:shadow-[0_10px_34px_rgba(65,24,138,0.45),0_0_24px_rgba(217,70,239,0.25),inset_0_1px_12px_rgba(255,255,255,0.1)] ${className}`}
      >
        <div className="relative z-20 flex min-w-0 shrink-0 items-center">
          <KultLogo className="h-8 w-auto max-w-[118px] object-contain object-left min-[1190px]:h-10 min-[1190px]:max-w-[148px]" />
        </div>
        <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 min-[1190px]:gap-2.5">
          <TonWalletSignInButton responsive compact />
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            aria-label="Open dashboard"
            title="Open dashboard"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition active:scale-95 hover:border-fuchsia-300/50"
          >
            <LayoutDashboard className="size-4 shrink-0 stroke-[1.75]" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/search" })}
            aria-label="Search games"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition active:scale-95 hover:border-fuchsia-300/50"
          >
            <Search className="size-4 shrink-0 stroke-[1.75]" />
          </button>
          <button
            type="button"
            onClick={() => void openNotifications()}
            title="Open notifications"
            aria-label="Open notifications"
            className="relative grid size-9 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition active:scale-95 hover:border-fuchsia-300/50"
          >
            <Bell className="size-4 stroke-[1.75]" />
            {notifications.some((notification) => !notification.read) && (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>
          <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-[linear-gradient(135deg,#7c3aed,#d946ef)] px-2.5 text-[11px] font-black tabular-nums text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_14px_rgba(217,70,239,0.45)] min-[1190px]:gap-2 min-[1190px]:px-3 min-[1190px]:text-xs">
            <Zap
              className="size-3.5 shrink-0 fill-white text-white min-[1190px]:size-4"
              strokeWidth={1.75}
            />
            <span className="min-[1190px]:hidden">{formatCount(kultPoints)}</span>
            <span className="hidden min-[1190px]:inline">
              Level {kpLevel} · {formatCount(kultPoints)} KP
            </span>
          </div>
        </div>
      </header>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-h-[82vh] overflow-y-auto rounded-[1.5rem] border-2 border-fuchsia-200 bg-white/92 text-violet-950 shadow-[0_0_30px_rgba(168,85,247,0.35)] backdrop-blur sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl font-black">
              <Bell className="size-5 text-primary" /> Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <button
                key={`${notification.createdAt}-${index}`}
                type="button"
                onClick={() => openNotificationTarget(notification)}
                disabled={!notification.gameId}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  notification.read
                    ? "border-border/50 bg-background/30"
                    : "border-primary/45 bg-primary/10"
                } ${notification.gameId ? "hover:border-primary/60" : "cursor-default"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold">{notification.title}</p>
                  {!notification.read && <span className="mt-1 size-1.5 rounded-full bg-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
              </button>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
