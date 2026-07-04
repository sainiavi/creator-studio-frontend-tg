import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { recordShare, type SharePlatform } from "@/lib/api/social";
import { getCurrentUserId } from "@/lib/identity";

/**
 * The "Share this game" modal (same design as the play page's share dialog),
 * reusable from any card or button. Opens platform share targets, records the
 * share on the backend, and reports the fresh share count via onShared.
 */
export function ShareGameModal({
  open,
  onClose,
  gameId,
  title,
  category,
  thumbnailUrl,
  onShared,
}: {
  open: boolean;
  onClose: () => void;
  gameId: string;
  title: string;
  category?: string;
  thumbnailUrl?: string;
  onShared?: (count: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Link to THIS game (its real id), honoring the app's base path (/studio/).
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  const path = `${base}play/${gameId}`;
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  const record = async (platform: SharePlatform) => {
    try {
      const result = await recordShare(gameId, getCurrentUserId(), platform);
      onShared?.(result.count);
    } catch {
      // silent — sharing still worked locally
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      await record("link");
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handlePlatformClick = async (platform: SharePlatform) => {
    if (platform === "twitter") {
      window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out this awesome game!")}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this awesome game! ${url}`)}`, "_blank");
    } else if (platform === "discord" || platform === "instagram" || platform === "youtube") {
      await navigator.clipboard.writeText(url).catch(() => null);
    } else if (platform === "email") {
      window.open(`mailto:?subject=${encodeURIComponent("Check out this awesome game!")}&body=${encodeURIComponent(`Play this game on Creator Spark Studio:\n\n${url}`)}`, "_self");
    }

    await record(platform);

    if (platform === "discord" || platform === "instagram" || platform === "youtube") {
      const target =
        platform === "discord"
          ? "Paste it in Discord."
          : platform === "instagram"
            ? "Ready to share on Instagram."
            : "Paste it in your YouTube video or community post.";
      showToast(`Link copied! ${target}`);
    } else {
      onClose(); // Close modal for redirect shares
    }
  };

  const platforms = [
    {
      label: "Copy Link",
      platform: "link" as const,
      icon: (
        <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
      ),
      bgClass: "bg-white/10 hover:bg-white/20 border-white/5",
      action: handleCopy,
    },
    {
      label: "X (Twitter)",
      platform: "twitter" as const,
      icon: (
        <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bgClass: "bg-black hover:bg-zinc-900 border-white/10",
      action: () => handlePlatformClick("twitter"),
    },
    {
      label: "WhatsApp",
      platform: "whatsapp" as const,
      icon: (
        <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
        </svg>
      ),
      bgClass: "bg-[#25D366] hover:bg-[#20ba59] border-green-400/20",
      action: () => handlePlatformClick("whatsapp"),
    },
    {
      label: "Discord",
      platform: "discord" as const,
      icon: (
        <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.46-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
        </svg>
      ),
      bgClass: "bg-[#5865F2] hover:bg-[#4752c4] border-indigo-400/20",
      action: () => handlePlatformClick("discord"),
    },
    {
      label: "Instagram",
      platform: "instagram" as const,
      icon: (
        <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
      bgClass:
        "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 border-pink-400/20",
      action: () => handlePlatformClick("instagram"),
    },
    {
      label: "Telegram",
      platform: "telegram" as const,
      icon: (
        <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.61l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.28-.58.28l.2-2.94 5.35-4.83c.23-.2-.05-.32-.36-.12l-6.62 4.17-2.85-.89c-.62-.19-.63-.62.13-.91l11.13-4.29c.51-.19.96.11.8.88z" />
        </svg>
      ),
      bgClass: "bg-[#26A5E4] hover:bg-[#2295ce] border-sky-400/20",
      action: () => handlePlatformClick("telegram"),
    },
    {
      label: "YouTube",
      platform: "youtube" as const,
      icon: (
        <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      bgClass: "bg-[#FF0000] hover:bg-[#d90000] border-red-400/20",
      action: () => handlePlatformClick("youtube"),
    },
    {
      label: "Email",
      platform: "email" as const,
      icon: (
        <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      ),
      bgClass: "bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50",
      action: () => handlePlatformClick("email"),
    },
  ];

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      // Cards open on pointerup — swallow pointer events so interacting with
      // the portal-rendered modal doesn't also trigger the card underneath.
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-white/15 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <h3 className="mb-5 text-xl font-black text-white">Share this game</h3>

        <div className="mb-6 flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/10 text-3xl shadow-inner">
            <img
              src={thumbnailUrl}
              alt={title}
              onError={(event) => {
                // missing cover: show the emoji tile instead of a broken icon
                event.currentTarget.style.display = "none";
                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "block";
              }}
              className="size-full object-cover"
            />
            <span style={{ display: "none" }}>🎮</span>
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-base font-black text-white">{title}</h4>
            <p className="truncate text-xs font-bold uppercase text-white/40">
              {category ?? "Game"} - HTML5 Game
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.platform}
              onClick={platform.action}
              className="group flex min-w-0 flex-col items-center gap-2"
            >
              <span
                className={`grid size-12 place-items-center rounded-md border transition group-hover:scale-105 ${platform.bgClass}`}
              >
                {platform.icon}
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-white/60 group-hover:text-white">
                {platform.label}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 pt-5">
          <label className="mb-2 block text-[10px] font-black uppercase text-white/40">
            Direct Link
          </label>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={url}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white/80 outline-none"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-white px-4 py-2.5 text-xs font-black text-black"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-white px-4 py-2 text-xs font-black text-black shadow-xl">
            {toastMessage}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
