import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type LazyVideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  loadSrc?: () => Promise<{ default: string }>;
  /** Static URL (e.g. /media/foo.mp4) — skips bundling the file. */
  directSrc?: string;
  skeletonClassName?: string;
};

export function LazyVideo({ loadSrc, directSrc, skeletonClassName, className, ...props }: LazyVideoProps) {
  const [src, setSrc] = useState<string | null>(directSrc ?? null);

  useEffect(() => {
    if (directSrc) {
      setSrc(directSrc);
      return;
    }
    if (!loadSrc) return;
    let cancelled = false;
    void loadSrc().then((mod) => {
      if (!cancelled) setSrc(mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [loadSrc, directSrc]);

  if (!src) {
    return <Skeleton className={skeletonClassName ?? "aspect-video w-full rounded-3xl"} />;
  }

  return <video {...props} className={className} src={src} preload="none" />;
}
