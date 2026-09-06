import React from "react";
import { useMissionControlViewModel } from "../hooks/useMissionControlViewModel";
import { MissionControlV2 } from "./MissionControlView";
import { PageShell } from "@/shared/ui/PageShell";
import { PageState } from "@/shared/ui/PageState";
import { Skeleton } from '@/shared/ui/Skeleton';
import { useSEO } from "@/shared/seo";

export function DashboardPage() {
  const vm = useMissionControlViewModel();

  useSEO({
    title: 'Dashboard',
    description: 'Ryokai mission control dashboard: real-time velocity, active tasks, blockers, and workspace telemetry.',
    ogTitle: 'Dashboard | Ryokai',
    noindex: true,
  });

  return (
    <PageShell maxWidth="default">
      <PageState state={vm.pageState || "ready"} moduleId="tasks" stateProps={{ skeleton: <MissionControlSkeleton /> }}>
        <MissionControlV2 vm={vm} />
      </PageState>
    </PageShell>
  );
}

function MissionControlSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
