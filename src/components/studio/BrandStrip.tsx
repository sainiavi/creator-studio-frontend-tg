import { useNavigate } from "@tanstack/react-router";
import creatorStudioLogo from "@/assets/creatorStudioLogo.webp";
import zeroGLogo from "@/assets/0gLogo.svg";

type BrandStripProps = {
  className?: string;
  /** bar = full-width strip above header; inline = compact row inside the header */
  variant?: "bar" | "inline";
};

/** Kult Create × 0G co-branding for the home page (mobile-first). */
export function BrandStrip({ className = "", variant = "bar" }: BrandStripProps) {
  const navigate = useNavigate();

  const createLogo = (
    <img
      src={creatorStudioLogo}
      alt="Kult Create"
      className={
        variant === "inline"
          ? "h-5 w-auto max-w-[92px] object-contain object-left"
          : "h-4 w-auto max-w-[84px] object-contain object-center"
      }
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );

  const logos = (
    <>
      {variant === "inline" ? (
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          aria-label="Go to Kult Create home"
          className="inline-flex shrink-0 items-center rounded-lg outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-fuchsia-300"
        >
          {createLogo}
        </button>
      ) : (
        createLogo
      )}
      <span className="text-[9px] font-bold text-violet-300/45" aria-hidden="true">
        ×
      </span>
      <img
        src={zeroGLogo}
        alt="0G"
        className={
          variant === "inline"
            ? "h-4 w-auto max-w-[44px] object-contain object-left brightness-0 invert opacity-90"
            : "h-3.5 w-auto max-w-[40px] object-contain object-center brightness-0 invert opacity-90"
        }
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </>
  );

  if (variant === "inline") {
    return (
      <div
        className={`flex shrink-0 items-center gap-1.5 ${className}`}
        aria-label="Kult Create and 0G branding"
      >
        {logos}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 border-b border-fuchsia-300/15 bg-[#0b0419]/95 px-3 py-1 backdrop-blur-md ${className}`}
      aria-label="Kult Create and 0G branding"
    >
      {logos}
    </div>
  );
}
