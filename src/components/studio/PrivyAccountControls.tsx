// import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
// import { usePrivy } from "@privy-io/react-auth";
// import { LogIn, LogOut, MessageCircle, WalletCards } from "lucide-react";
// import { useState } from "react";
// import { hasTelegramAccount, hasTonWallet } from "@/lib/privyIdentity";
import { getCurrentUsername } from "@/lib/identity";

// function compact(value: string) {
//   return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
// }

export function PrivyAccountControls({ collapsed }: { collapsed: boolean }) {
  // TEMP: bypass Privy account controls for local debugging
  const identity = getCurrentUsername();

  return (
    <div className={`mb-4 ${collapsed ? "px-0" : "px-2"}`}>
      {!collapsed ? (
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-amber-950">
          <p className="label-mono text-[10px] font-black text-amber-600">DEV MODE (NO PRIVY)</p>
          <p className="mt-1 truncate font-mono text-xs font-bold">{identity}</p>
        </div>
      ) : (
        <div
          className="flex size-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50/80 text-[10px] font-black text-amber-700"
          title={`Dev mode: ${identity}`}
        >
          DEV
        </div>
      )}
    </div>
  );

  // export function PrivyAccountControls({ collapsed }: { collapsed: boolean }) {
  //   const { ready, authenticated, login, logout, user, linkTelegram } = usePrivy();
  //   const { createWallet } = useCreateWallet();
  //   const [creatingTon, setCreatingTon] = useState(false);
  //   const [error, setError] = useState<string | null>(null);
  //   const tonWallet = getTonWalletAddress();
  //   const evmWallet = getWalletAddress();
  //   const identity = tonWallet ?? evmWallet ?? getCurrentUserId();
  //   const linkedTelegram = hasTelegramAccount(user);
  //   const linkedTon = hasTonWallet(user);
  //
  //   const createTonWallet = async () => {
  //     setError(null);
  //     setCreatingTon(true);
  //     try {
  //       await createWallet({ chainType: "ton" });
  //     } catch (cause) {
  //       setError(cause instanceof Error ? cause.message : "Could not create TON wallet");
  //     } finally {
  //       setCreatingTon(false);
  //     }
  //   };
  //
  //   if (!ready) {
  //     return (
  //       <div className={`mb-4 ${collapsed ? "px-0" : "px-2"}`}>
  //         <div className="h-9 animate-pulse rounded-xl bg-white/55" />
  //       </div>
  //     );
  //   }
  //
  //   if (!authenticated) {
  //     return (
  //       <button
  //         type="button"
  //         onClick={() => login({ loginMethods: ["telegram", "wallet"] })}
  //         className={`mb-4 flex items-center justify-center rounded-xl border border-violet-200 bg-white/70 text-violet-800 transition hover:bg-white ${
  //           collapsed ? "size-10" : "gap-2 px-3 py-2"
  //         }`}
  //         title="Sign in"
  //       >
  //         <LogIn className="size-4" />
  //         {!collapsed && <span className="label-mono text-xs font-bold">SIGN IN</span>}
  //       </button>
  //     );
  //   }
  //
  //   return (
  //     <div className={`mb-4 space-y-2 ${collapsed ? "px-0" : "px-2"}`}>
  //       {!collapsed && (
  //         <div className="rounded-xl border border-violet-200/70 bg-white/65 px-3 py-2 text-violet-900">
  //           <p className="label-mono text-[10px] font-black text-violet-500">SIGNED IN</p>
  //           <p className="mt-1 truncate font-mono text-xs font-bold">{compact(identity)}</p>
  //         </div>
  //       )}
  //
  //       {!linkedTelegram && (
  //         <button
  //           type="button"
  //           onClick={() => linkTelegram({ launchParams: {} })}
  //           className={`flex items-center justify-center rounded-xl border border-violet-200 bg-white/70 text-violet-800 transition hover:bg-white ${
  //             collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
  //           }`}
  //           title="Link Telegram"
  //         >
  //           <MessageCircle className="size-4" />
  //           {!collapsed && <span className="label-mono text-xs font-bold">LINK TELEGRAM</span>}
  //         </button>
  //       )}
  //
  //       {!linkedTon && (
  //         <button
  //           type="button"
  //           onClick={() => void createTonWallet()}
  //           disabled={creatingTon}
  //           className={`flex items-center justify-center rounded-xl border border-violet-200 bg-white/70 text-violet-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${
  //             collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
  //           }`}
  //           title="Create TON wallet"
  //         >
  //           <WalletCards className="size-4" />
  //           {!collapsed && (
  //             <span className="label-mono text-xs font-bold">
  //               {creatingTon ? "CREATING..." : "CREATE TON"}
  //             </span>
  //           )}
  //         </button>
  //       )}
  //
  //       <button
  //         type="button"
  //         onClick={() => void logout()}
  //         className={`flex items-center justify-center rounded-xl border border-violet-200 bg-white/50 text-violet-600 transition hover:bg-white hover:text-violet-900 ${
  //           collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
  //         }`}
  //         title="Sign out"
  //       >
  //         <LogOut className="size-4" />
  //         {!collapsed && <span className="label-mono text-xs font-bold">SIGN OUT</span>}
  //       </button>
  //
  //       {!collapsed && error && (
  //         <p className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
  //           {error}
  //         </p>
  //       )}
  //     </div>
  //   );
  // }
}
