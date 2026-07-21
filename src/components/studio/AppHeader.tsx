import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Search, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KultLogo } from "@/components/studio/KultLogo";
import { TonWalletSignInButton } from "@/components/studio/TonWalletSignInButton";
import { SearchModal } from "@/components/studio/SearchModal";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [kultPoints, setKultPoints] = useState(0);
  const [kpLevel, setKpLevel] = useState(1);

  useEffect(() => {
    const userId = getCurrentUserId();
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
    fetchPointSummary(getCurrentUserId())
      .then((summary) => {
        setKultPoints(summary.kultPoints ?? summary.lifetimePoints ?? 0);
        setKpLevel(summary.level?.level ?? 1);
      })
      .catch(() => {});
  }, []);

  const openNotifications = async () => {
    setNotificationsOpen(true);
    const userId = getCurrentUserId();
    const data = await fetchNotifications(userId).catch(() => null);
    if (data) setNotifications(data.notifications);
    await markNotificationsRead(userId).catch(() => null);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const openNotificationTarget = (notification: NotificationItem) => {
    if (!notification.gameId) return;
    setNotificationsOpen(false);
    navigate({ to: "/play/$gameId", params: { gameId: notification.gameId } });
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 flex min-h-[56px] items-center justify-between gap-3 border-b border-white/[0.06] bg-[linear-gradient(180deg,#07050f_0%,#12081f_55%,#160b2e_100%)] px-3 py-2.5 text-white shadow-[0_10px_28px_rgba(8,4,20,0.55)] md:relative md:top-auto md:z-20 md:rounded-[1.65rem] md:border-2 md:border-fuchsia-200 md:border-b-2 md:bg-[#100528] md:bg-none md:px-6 md:py-3 md:shadow-[0_6px_0_rgba(65,24,138,0.75),0_0_34px_rgba(217,70,239,0.9),inset_0_1px_18px_rgba(255,255,255,0.16)] md:backdrop-blur ${className}`}
      >
        <div className="relative z-20 flex min-w-0 shrink-0 items-center">
          <KultLogo className="h-8 w-auto max-w-[118px] object-contain object-left sm:h-10 sm:max-w-[148px]" />
        </div>
        <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 sm:gap-2.5">
          <TonWalletSignInButton responsive compact />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search games"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/18 bg-[#1b1d27] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition active:scale-95 hover:border-white/30"
          >
            <Search className="size-4 shrink-0 stroke-[1.75]" />
          </button>
          <button
            type="button"
            onClick={() => void openNotifications()}
            title="Open notifications"
            aria-label="Open notifications"
            className="relative grid size-9 shrink-0 place-items-center rounded-full border border-white/18 bg-[#1b1d27] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition active:scale-95 hover:border-white/30"
          >
            <Bell className="size-4 stroke-[1.75]" />
            {notifications.some((notification) => !notification.read) && (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>
          <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/18 bg-[#1b1d27] px-2.5 text-[11px] font-black tabular-nums text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:gap-2 sm:px-3 sm:text-xs">
            <Zap className="size-3.5 shrink-0 fill-white text-white sm:size-4" strokeWidth={1.75} />
            <span className="sm:hidden">{formatCount(kultPoints)}</span>
            <span className="hidden sm:inline">
              Level {kpLevel} · {formatCount(kultPoints)} KP
            </span>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

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
