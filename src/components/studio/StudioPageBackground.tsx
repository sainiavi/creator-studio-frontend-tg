import backgroundImage from "@/assets/background.webp";

type StudioPageBackgroundProps = {
  className?: string;
};

export function StudioPageBackground({ className = "" }: StudioPageBackgroundProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      {/* Black overlay to darken the background image. */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.35)_42%,transparent_62%)] opacity-60" />
    </div>
  );
}
