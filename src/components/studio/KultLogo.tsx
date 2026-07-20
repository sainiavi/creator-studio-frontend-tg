import creatorStudioLogo from "@/assets/creatorStudioLogo.png";

type KultLogoProps = {
  className?: string;
};

export function KultLogo({ className = "h-9 w-auto object-contain" }: KultLogoProps) {
  return (
    <img
      src={creatorStudioLogo}
      alt="Kult Create"
      className={className}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}
