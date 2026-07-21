import { Skeleton } from "@/components/ui/skeleton";

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">{children}</div>;
}

export function RoutePendingSkeleton() {
  return (
    <PageShell>
      <Skeleton className="mb-6 h-14 w-full max-w-md rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-2xl" />
        ))}
      </div>
    </PageShell>
  );
}

export function HomeFeedSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Skeleton className="mx-auto h-52 w-full max-w-5xl rounded-b-3xl" />
      <PageShell>
        <div className="mb-8 flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, section) => (
          <div key={section} className="mb-10">
            <Skeleton className="mb-4 h-7 w-48 rounded-lg" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-56 w-44 shrink-0 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </PageShell>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ddff]">
      <PageShell>
        <Skeleton className="mb-5 h-20 w-full rounded-[1.65rem]" />
        <div className="mb-5 flex justify-center gap-3">
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-28 rounded-2xl" />
        </div>
        <div className="mb-6 grid grid-cols-3 items-end gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="overflow-hidden rounded-[1.5rem] border border-violet-200/70 bg-white/80 p-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[64px_1fr_auto] gap-3 border-b border-violet-100 px-4 py-4 last:border-0">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 justify-self-end" />
            </div>
          ))}
        </div>
      </PageShell>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ddff]">
      <PageShell>
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <Skeleton className="mx-auto h-8 w-48 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-64 sm:mx-0" />
            <div className="flex justify-center gap-2 sm:justify-start">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mb-4 h-10 w-full max-w-xl rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    </div>
  );
}

export function PlayPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070a12] lg:flex-row">
      <Skeleton className="aspect-[9/16] w-full lg:min-h-screen lg:w-[420px] lg:shrink-0" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="size-11 rounded-full" />
          ))}
        </div>
        <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CreatePageSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ddff]">
      <PageShell>
        <Skeleton className="mb-6 h-24 w-full rounded-[1.65rem]" />
        <Skeleton className="mb-4 h-36 w-full rounded-3xl" />
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
      </PageShell>
    </div>
  );
}

export function EditPageSkeleton() {
  return (
    <div className="grid min-h-screen gap-4 bg-background p-4 lg:grid-cols-[1fr_360px]">
      <Skeleton className="min-h-[60vh] rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function TemplatesGridSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ddff]">
      <Skeleton className="h-16 w-full rounded-none sm:mx-auto sm:mt-6 sm:h-20 sm:max-w-6xl sm:rounded-2xl sm:px-6" />
      <PageShell>
        <div className="mb-4 flex justify-center sm:justify-start">
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] rounded-[1.25rem]" />
          ))}
        </div>
      </PageShell>
    </div>
  );
}

export function MorePageSkeleton() {
  return (
    <div>
      <Skeleton className="h-16 w-full" />
      <PageShell>
        <Skeleton className="mb-4 h-10 w-72" />
        <Skeleton className="mb-8 aspect-video w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    </div>
  );
}

export function ActivityListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-violet-200/60 bg-white/70 p-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PreviewSkeleton() {
  return <Skeleton className="h-full min-h-[320px] w-full rounded-xl bg-primary/10" />;
}
