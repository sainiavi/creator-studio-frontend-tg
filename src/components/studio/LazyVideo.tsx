import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type LazyVideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  loadSrc: () => Promise<{ default: string }>;
  skeletonClassName?: string;
};

export function LazyVideo({ loadSrc, skeletonClassName, className, ...props }: LazyVideoProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSrc().then((mod) => {
      if (!cancelled) setSrc(mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [loadSrc]);

  if (!src) {
    return <Skeleton className={skeletonClassName ?? "aspect-video w-full rounded-3xl"} />;
  }

  return <video {...props} className={className} src={src} preload="none" />;
}
