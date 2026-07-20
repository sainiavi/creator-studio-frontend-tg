type StudioPageBackgroundProps = {
  className?: string;
};

const STAR_FIELD = [
  "radial-gradient(1px 1px at 6% 8%, rgba(255,255,255,0.95), transparent)",
  "radial-gradient(1.2px 1.2px at 14% 22%, rgba(255,255,255,0.8), transparent)",
  "radial-gradient(1px 1px at 22% 12%, rgba(255,255,255,0.55), transparent)",
  "radial-gradient(1.6px 1.6px at 31% 34%, rgba(255,255,255,0.9), transparent)",
  "radial-gradient(1px 1px at 39% 18%, rgba(255,255,255,0.65), transparent)",
  "radial-gradient(1px 1px at 47% 42%, rgba(255,255,255,0.5), transparent)",
  "radial-gradient(1.3px 1.3px at 55% 9%, rgba(255,255,255,0.85), transparent)",
  "radial-gradient(1px 1px at 63% 28%, rgba(255,255,255,0.6), transparent)",
  "radial-gradient(1.8px 1.8px at 71% 16%, rgba(255,255,255,0.95), transparent)",
  "radial-gradient(1px 1px at 78% 38%, rgba(255,255,255,0.55), transparent)",
  "radial-gradient(1px 1px at 86% 11%, rgba(255,255,255,0.75), transparent)",
  "radial-gradient(1.2px 1.2px at 93% 31%, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1px 1px at 11% 58%, rgba(255,255,255,0.6), transparent)",
  "radial-gradient(1.4px 1.4px at 19% 72%, rgba(255,255,255,0.85), transparent)",
  "radial-gradient(1px 1px at 28% 64%, rgba(255,255,255,0.45), transparent)",
  "radial-gradient(1px 1px at 36% 81%, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1.7px 1.7px at 44% 56%, rgba(255,255,255,0.9), transparent)",
  "radial-gradient(1px 1px at 52% 74%, rgba(255,255,255,0.55), transparent)",
  "radial-gradient(1px 1px at 60% 62%, rgba(255,255,255,0.65), transparent)",
  "radial-gradient(1.2px 1.2px at 68% 88%, rgba(255,255,255,0.8), transparent)",
  "radial-gradient(1px 1px at 76% 68%, rgba(255,255,255,0.5), transparent)",
  "radial-gradient(1.5px 1.5px at 84% 54%, rgba(255,255,255,0.88), transparent)",
  "radial-gradient(1px 1px at 92% 76%, rgba(255,255,255,0.6), transparent)",
  "radial-gradient(1px 1px at 4% 91%, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1.3px 1.3px at 48% 94%, rgba(255,255,255,0.75), transparent)",
].join(", ");

const STAR_TILE = [
  "radial-gradient(1px 1px at 18px 24px, rgba(255,255,255,0.55), transparent)",
  "radial-gradient(1px 1px at 52px 12px, rgba(255,255,255,0.35), transparent)",
  "radial-gradient(1.2px 1.2px at 84px 36px, rgba(255,255,255,0.65), transparent)",
  "radial-gradient(1px 1px at 34px 58px, rgba(255,255,255,0.4), transparent)",
  "radial-gradient(1px 1px at 72px 68px, rgba(255,255,255,0.5), transparent)",
  "radial-gradient(1.4px 1.4px at 108px 18px, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1px 1px at 14px 82px, rgba(255,255,255,0.45), transparent)",
  "radial-gradient(1px 1px at 96px 92px, rgba(255,255,255,0.55), transparent)",
].join(", ");

export function StudioPageBackground({ className = "" }: StudioPageBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#d8cff8_0%,#c4b6f2_38%,#b39aed_62%,#9f87e7_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(244,114,182,0.22),transparent_28%),radial-gradient(circle_at_12%_55%,rgba(139,92,246,0.2),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.14),rgba(124,58,237,0.1))]" />
      <div
        className="absolute inset-0 opacity-80"
        style={{ backgroundImage: STAR_FIELD, backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }}
      />
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage: STAR_TILE,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.35)_42%,transparent_62%)] opacity-60" />
    </div>
  );
}
