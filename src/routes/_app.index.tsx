import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { HomeFeedSkeleton } from "@/components/studio/PageSkeletons";

const HomePage = lazy(() =>
  import("./_app.index.full").then((module) => ({ default: module.Home })),
);

function HomeRoute() {
  return (
    <Suspense fallback={<HomeFeedSkeleton />}>
      <HomePage />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/")({
  pendingComponent: HomeFeedSkeleton,
  head: () => ({
    meta: [
      { title: "Home - Creator Studio" },
      { name: "description", content: "Create, publish, and grow playable games with AI." },
    ],
  }),
  component: HomeRoute,
});
