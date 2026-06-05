import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Game } from "@/lib/games-data";
import { GameCard } from "./GameCard";

export function GameRow({ title, games }: { title: string; games: Game[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const emblaNode = emblaApi.rootNode();
    
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const delta = isHorizontal ? deltaX : deltaY;
      
      if (Math.abs(delta) < 10) return;
      
      const now = Date.now();
      if (now - lastWheelTime < 200) return;
      
      if (delta > 0 && emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
        e.preventDefault();
        lastWheelTime = now;
      } else if (delta < 0 && emblaApi.canScrollPrev()) {
        emblaApi.scrollPrev();
        e.preventDefault();
        lastWheelTime = now;
      }
    };

    emblaNode.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      emblaNode.removeEventListener("wheel", handleWheel);
    };
  }, [emblaApi]);

  return (
    <section className="px-6 py-6 lg:px-10">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-black tracking-tight lg:text-3xl">
            {title}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden cursor-grab active:cursor-grabbing select-none overscroll-x-contain" ref={emblaRef}>
        <div className="flex gap-4">
          {games.map((g, i) => (
            <div
              key={g.title}
              className="min-w-0 shrink-0 grow-0 basis-[calc(50%-8px)] sm:basis-[calc(33.333%-11px)] xl:basis-[calc(25%-12px)] 2xl:basis-[calc(20%-13px)]"
            >
              <GameCard game={g} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}