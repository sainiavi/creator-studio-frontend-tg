import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ZeroGWalletPanel } from "@/components/studio/ZeroGWalletPanel";
import { clearAuthToken } from "@/lib/api";

type WalletAccountPopoverProps = {
  trigger: ReactNode;
  onSignOut: () => void | Promise<void>;
};

export function WalletAccountPopover({ trigger, onSignOut }: WalletAccountPopoverProps) {
  const handleSignOut = () => {
    clearAuthToken();
    void onSignOut();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,22rem)] overflow-hidden rounded-[1.35rem] border border-fuchsia-400/20 bg-[#0f0624]/95 p-0 text-white shadow-[0_24px_60px_rgba(46,8,84,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl"
      >
        <div className="border-b border-white/8 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/10 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200/70">
            Creator wallet
          </p>
          <p className="mt-0.5 font-display text-sm font-bold text-white/90">
            Manage your 0G balance
          </p>
        </div>

        <div className="p-4">
          <ZeroGWalletPanel showHeading variant="modal" className="border-none bg-transparent p-0" />
        </div>

        <div className="border-t border-white/8 bg-black/20 px-4 py-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100 active:scale-[0.98]"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
