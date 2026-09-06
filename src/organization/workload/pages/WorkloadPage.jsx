import React, { useMemo, useState, useEffect } from 'react';
import { usePermissions } from '@/identity';
import { useWorkload } from '@/organization/workload/features/hooks/useWorkload';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';
import {
  PageShell, PageHero, PageContent,
} from '@/shared/ui/PageShell';
import { PageState } from '@/shared/ui/PageState';
import {
  deriveOrgStats,
  getTeamHealthScore,
} from '@/organization/workload/features/utils/workloadCalculations';
import {
  OrgSnapshotBanner,
  AIInsightsPanel,
  TeamHealthCard,
  DistributionChart,
  RebalanceSimulator,
} from '@/organization/workload/features/components';
import { getThresholdKey } from '../features/utils/workloadHistoryStorage';
import { CapacityThresholdControl } from '../components/CapacityThresholdControl';
import { SectionDivider } from '../components/SectionDivider';
import { HeatmapMatrix } from '../components/HeatmapMatrix';
import { WorkloadFilters } from '../components/WorkloadFilters';
import { MemberUtilizationGrid } from '../components/MemberUtilizationGrid';
import { WorkloadMatrixTable } from '../components/WorkloadMatrixTable';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Gauge, Building2 } from 'lucide-react';

export function WorkloadPage() {
  const { activeOrganization } = useWorkspace();
  const { userOrg } = usePermissions();
  const orgId = activeOrganization?.id || userOrg?.id;

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkload(orgId);

  const [threshold, setThreshold] = useState(() => {
    const saved = orgId ? localStorage.getItem(getThresholdKey(orgId)) : null;
    return saved ? parseInt(saved, 10) : 8;
  });
  
  const history = useMemo(() => {
    const hist = {};
    rows.forEach((row) => {
      const userId = row.user?.id || row.user?.username;
      if (userId) {
        hist[userId] = row.history || [];
      }
    });
    return hist;
  }, [rows]);

  const [filter, setFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});

  /* --- Stepper handlers --- */
  const handleDecrement = () => {
    if (threshold <= 2) return;
    const next = threshold - 1;
    setThreshold(next);
    if (orgId) localStorage.setItem(getThresholdKey(orgId), String(next));
  };
  const handleIncrement = () => {
    if (threshold >= 20) return;
    const next = threshold + 1;
    setThreshold(next);
    if (orgId) localStorage.setItem(getThresholdKey(orgId), String(next));
  };

  const stats = useMemo(
    () => deriveOrgStats(rows, threshold),
    [rows, threshold],
  );
  const healthScore = useMemo(
    () => getTeamHealthScore(rows, threshold),
    [rows, threshold],
  );

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'overloaded')
      return rows.filter((r) => (r.totalActiveCount ?? 0) > threshold);
    if (filter === 'near')
      return rows.filter((r) => {
        const c = r.totalActiveCount ?? 0;
        return c >= threshold * 0.75 && c <= threshold;
      });
    if (filter === 'balanced')
      return rows.filter((r) => (r.totalActiveCount ?? 0) < threshold * 0.75);
    if (filter === 'available')
      return rows.filter((r) => (r.totalActiveCount ?? 0) < threshold * 0.5);
    return rows;
  }, [rows, filter, threshold]);

  const toggleCard = (id) =>
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

  /* --- No active org: empty fallback --- */
  if (!orgId) {
    return (
      <PageShell maxWidth="default">
        <PageContent>
          <PageState
            state="empty"
            stateProps={{
              icon: Building2,
              title: 'Select an organization to view workload',
              description: 'Resource capacity and team member utilization tracking requires an active organization workspace.',
            }}
          />
        </PageContent>
      </PageShell>
    );
  }

  const pageState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : rows.length === 0
        ? 'empty'
        : 'ready';

  return (
    <PageShell maxWidth="default">
      {/* === Header === */}
      <PageHero
        eyebrow="Resource Capacity"
        title="Team Capacity & Utilization"
        subtitle="Monitor team load balance and task allocation bottlenecks across the organization."
        icon={Gauge}
      >
        <CapacityThresholdControl
          threshold={threshold}
          isLoading={isLoading}
          onDecrement={handleDecrement}
          onIncrement={handleIncrement}
          onRefresh={() => refetch()}
        />
      </PageHero>

      <PageContent>
        <PageState
          state={pageState}
          stateProps={{skeleton: <WorkloadSkeleton />, 
            loadingVariant: 'dashboard',
            onAction: () => refetch(),
            actionLabel: 'Refresh Workload',
            title: 'No Workload Matrix Available',
            description: 'There are currently no active workload assignments or team member metrics for this organization.',
            onRetry: () => refetch(),
          }}
        >
          <div className="flex flex-col gap-6">
            {/* === KPI Strip === */}
            <OrgSnapshotBanner stats={stats} threshold={threshold} />

            {/* === Team Pulse === */}
            <SectionDivider title="Team pulse" tag="Live" hint="updated 2 min ago" />
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1.3fr] gap-3.5">
              <TeamHealthCard score={healthScore} stats={stats} />
              <AIInsightsPanel stats={stats} />
            </div>

            {/* === Load Shape === */}
            <SectionDivider title="Load shape" tag="Analytics" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <DistributionChart rows={rows} threshold={threshold} />
              <RebalanceSimulator rows={rows} threshold={threshold} />
            </div>

            {/* === 14-Day Heatmap === */}
            <SectionDivider
              title="14-day capacity heatmap"
              tag="History"
              hint="hover cells for detail"
            />
            <HeatmapMatrix
              rows={rows}
              threshold={threshold}
              history={history}
            />

            {/* === Member Capacity (Roster) === */}
            <SectionDivider title="Member capacity" tag="Roster" />
            <div className="flex items-center gap-3 flex-wrap">
              <WorkloadFilters value={filter} onChange={setFilter} />
              <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)]">
                showing{' '}
                <b className="text-[var(--text-primary)]">{filteredRows.length}</b>{' '}
                of <b className="text-[var(--text-primary)]">{rows.length}</b>{' '}
                members
              </span>
            </div>
            <MemberUtilizationGrid
              rows={filteredRows}
              threshold={threshold}
              history={history}
              expandedCards={expandedCards}
              onToggleCard={toggleCard}
            />

            {/* === Workload Matrix Table === */}
            <SectionDivider title="Workload matrix" tag="Table" />
            <WorkloadMatrixTable
              rows={filteredRows}
              threshold={threshold}
              history={history}
              isLoading={isLoading}
            />

            {/* === Footer Note === */}
            <div className="mt-4 text-center font-mono text-[10.5px] text-[var(--text-tertiary)] tracking-[0.06em]">
              V1   Capacity Command   workload view
            </div>
          </div>
        </PageState>
      </PageContent>
    </PageShell>
  );
}

function WorkloadSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-52 rounded-2xl" />
        <div className="md:col-span-2 space-y-3"><Skeleton className="h-52 rounded-2xl" /></div>
      </div>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
        <div className="h-10 bg-[var(--bg-subtle)]" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-none border-b border-[var(--border-subtle)]" />)}
      </div>
    </div>
  );
}
