import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Text } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useDashboardStats } from '@/analytics'
import { StatCard } from '@/analytics'
import { CompletionChart, PriorityChart } from '@/analytics'
import {
  CheckCircle2, TrendingUp, PlusCircle, AlertCircle, Clock,
  ShieldAlert, Timer, BarChart3, RefreshCw, Layers, ArrowRight
} from '@/shared/ui/Icons'
import { PageShell, PageHero, PageContent } from '@/shared/ui/PageShell'
import { PageState } from '@/shared/ui/PageState'
import { InsightSection } from '@/shared/workspace-framework'
import { useWorkspace } from '@/app/providers/WorkspaceProvider'
import { cn } from '@/shared/lib/cn'
import { useSEO } from '@/shared/seo'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

/**
 * Structure-matched Skeleton for Analytics
 * Eliminates layout shift (CLS < 0.05) and mirrors the 3-tier layout.
 */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Tier 1 skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-44 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>

      {/* Tier 2 skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Tier 3 skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Skeleton className="h-[460px] rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[460px] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const navigate = useNavigate()
  const { workspaceMode, activeOrganization, activeCrew } = useWorkspace()

  useSEO({
    title: 'Analytics & Velocity',
    description: 'Comprehensive workspace metrics, completion trends, velocity, and stage breakdowns.',
    ogTitle: 'Analytics | Ryokai',
    noindex: true,
  })

  // Stats follow the workspace lens: ORG -> org scope, CREWS -> active crew,
  // otherwise strictly personal. No cross-mode data mixing.
  const statsParams = useMemo(() => {
    if (workspaceMode === 'ORG') return { scope: 'ORG', orgId: activeOrganization?.id || 'pending' }
    if (workspaceMode === 'CREWS') return { scope: 'CREWS', crewId: activeCrew?.id || 'pending' }
    return { scope: 'PERSONAL' }
  }, [workspaceMode, activeOrganization?.id, activeCrew?.id])

  const {
    data: rawStats,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useDashboardStats(statsParams)

  // Scope descriptive badge
  const scopeLabel = useMemo(() => {
    if (workspaceMode === 'ORG') {
      return `Organization • ${activeOrganization?.name || 'Selected Organization'}`
    }
    if (workspaceMode === 'CREWS') {
      return `Crew • ${activeCrew?.name || 'Selected Crew'}`
    }
    return 'Personal Workspace'
  }, [workspaceMode, activeOrganization?.name, activeCrew?.name])

  const stats = useMemo(() => {
    if (!rawStats) return null
    return {
      completionRate: Number(rawStats.myCompletionRate || rawStats.completionRate || 0),
      totalTasks: Number(rawStats.totalTasks || 0),
      doneCount: Number(rawStats.doneCount || 0),
      overdueCount: Number(rawStats.overdueCount || 0),
      todoCount: Number(rawStats.todoCount || 0),
      inReviewCount: Number(rawStats.inReviewCount || 0),
      revisionsCount: Number(rawStats.revisionsCount || 0),
      assignedToMe: Number(rawStats.assignedToMeCount || 0),
      priorityData: (rawStats.statusBreakdown || []).map((s) => ({
        name: s.status,
        value: s.count,
        color: s.color,
      })),
      historicalData: rawStats.historicalData || [],
    }
  }, [rawStats])

  const pageState = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : (!stats || stats.totalTasks === 0)
    ? 'empty'
    : 'ready'

  // Format last-synced timestamp
  const lastSyncedTime = useMemo(() => {
    if (!dataUpdatedAt) return null
    const date = new Date(dataUpdatedAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [dataUpdatedAt])

  const workloadProgress = useMemo(() => {
    if (!stats || stats.totalTasks === 0) return 0
    return Math.min(100, Math.round((stats.doneCount / stats.totalTasks) * 100))
  }, [stats])

  return (
    <PageShell maxWidth="default">
      <PageHero
        icon={BarChart3}
        eyebrow={scopeLabel}
        title="Analytics & Velocity"
        subtitle="Track execution velocity, workload completion rates, and status distribution across this workspace."
        actions={
          <div className="flex items-center gap-2">
            {lastSyncedTime && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-[var(--text-tertiary)] mr-1">
                Synced {lastSyncedTime}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 h-8 text-xs font-medium border-[var(--border-default)] hover:border-[var(--accent)] transition-colors"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', isFetching && 'animate-spin text-[var(--accent)]')}
              />
              <span>{isFetching ? 'Syncing...' : 'Sync'}</span>
            </Button>
          </div>
        }
      />

      <PageContent>
        <PageState
          state={pageState}
          stateProps={{
            skeleton: <AnalyticsSkeleton />,
            title: 'Unable to load analytics',
            description: 'Failed to retrieve metrics from the analytics server. Please verify your network connection.',
            icon: BarChart3,
            onRetry: () => refetch(),
            action: (
              <Button
                size="sm"
                onClick={() => navigate('/tasks')}
                className="gap-1.5"
              >
                Go to Tasks
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ),
          }}
        >
          <div className="space-y-8">
            {/* Tier 1 -- Hero KPIs (Identical height & 4-row layout) */}
            <InsightSection
              question="What is the overall health?"
              description="Primary velocity and workload indicators for this lens"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 col-span-full min-w-0"
                data-tour="analytics-stats"
              >
                <motion.div variants={itemVariants} className="h-full">
                  <StatCard
                    size="lg"
                    title="Completion rate"
                    value={`${stats?.completionRate || 0}%`}
                    progress={stats?.completionRate || 0}
                    tone={
                      (stats?.completionRate || 0) >= 80
                        ? 'success'
                        : (stats?.completionRate || 0) >= 50
                        ? 'active'
                        : 'default'
                    }
                    description={`${stats?.doneCount || 0} of ${stats?.totalTasks || 0} tasks finished`}
                    icon={CheckCircle2}
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                  <StatCard
                    size="lg"
                    title="Total workload"
                    value={stats?.totalTasks || 0}
                    progress={workloadProgress}
                    description={`${(stats?.todoCount || 0) + (stats?.inReviewCount || 0)} active • ${stats?.overdueCount || 0} overdue`}
                    icon={Layers}
                  />
                </motion.div>
              </motion.div>
            </InsightSection>

            {/* Tier 2 -- Grouped Secondary Metrics (Equalized Heights across both columns) */}
            <InsightSection
              question="What needs attention & where is work flowing?"
              description="Blockers requiring triage alongside current workflow stages"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-5 col-span-full min-w-0 items-stretch"
              >
                {/* Needs Attention (2 Cards) */}
                <div className="lg:col-span-1 min-w-0 flex flex-col justify-between">
                  <Text
                    size="xs"
                    className="mb-2.5 font-semibold text-[var(--text-tertiary)] uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
                    Needs Attention
                  </Text>
                  <div className="grid grid-cols-2 gap-3 flex-1 items-stretch">
                    <motion.div variants={itemVariants} className="h-full">
                      <StatCard
                        tone={stats?.overdueCount > 0 ? 'attention' : 'default'}
                        title="Overdue"
                        value={stats?.overdueCount || 0}
                        icon={AlertCircle}
                        description={stats?.overdueCount > 0 ? 'Past due date' : 'None overdue'}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="h-full">
                      <StatCard
                        tone={stats?.revisionsCount > 0 ? 'attention' : 'default'}
                        title="Revisions"
                        value={stats?.revisionsCount || 0}
                        icon={ShieldAlert}
                        description={stats?.revisionsCount > 0 ? 'Changes needed' : 'Clean reviews'}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Workflow Breakdown (4 Cards) */}
                <div className="lg:col-span-2 min-w-0 flex flex-col justify-between">
                  <Text
                    size="xs"
                    className="mb-2.5 font-semibold text-[var(--text-tertiary)] uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    Workflow Breakdown
                  </Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 items-stretch">
                    <motion.div variants={itemVariants} className="h-full">
                      <StatCard
                        title="Assigned to me"
                        value={stats?.assignedToMe || 0}
                        description="My active tasks"
                        icon={Clock}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="h-full">
                      <StatCard
                        title="To-do"
                        value={stats?.todoCount || 0}
                        description="Pending start"
                        icon={Timer}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="h-full">
                      <StatCard
                        tone={stats?.inReviewCount > 0 ? 'active' : 'default'}
                        title="In review"
                        value={stats?.inReviewCount || 0}
                        description="Awaiting review"
                        icon={TrendingUp}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="h-full">
                      <StatCard
                        tone={stats?.doneCount > 0 ? 'success' : 'default'}
                        title="Done"
                        value={stats?.doneCount || 0}
                        description="Finished tasks"
                        icon={CheckCircle2}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </InsightSection>

            {/* Tier 3 -- Trends and Distribution (Fixed 460px Harmonized Height) */}
            <InsightSection
              question="How are trends shaping up?"
              description="Historical completion trajectory and distribution across task states"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 col-span-full min-w-0 items-stretch"
                data-tour="analytics-charts"
              >
                <div className="lg:col-span-2 min-w-0 h-[460px]">
                  <CompletionChart data={stats?.historicalData} />
                </div>
                <div className="lg:col-span-1 min-w-0 h-[460px]">
                  <PriorityChart data={stats?.priorityData} />
                </div>
              </motion.div>
            </InsightSection>
          </div>
        </PageState>
      </PageContent>
    </PageShell>
  )
}
