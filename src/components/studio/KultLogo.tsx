import { useNavigate } from "@tanstack/react-router";
import creatorStudioLogo from "@/assets/creatorStudioLogo.webp";

type KultLogoProps = {
  className?: string;
};

export function KultLogo({ className = "h-9 w-auto object-contain" }: KultLogoProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/" })}
      aria-label="Go to KULT home"
      className="group relative inline-flex shrink-0 items-center rounded-xl outline-none transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-fuchsia-300"
    >
      <img
        src={creatorStudioLogo}
        alt="Kult Create"
        className={className}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </button>
  );
}
