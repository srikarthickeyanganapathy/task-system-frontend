import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ListTodo, X, AlertTriangle, CalendarClock, Activity } from 'lucide-react'
import { Heading, Text } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Badge } from '@/shared/ui/Badge'
import { ProgressRing } from '@/shared/ui/Progress'
import { PillNav } from '@/shared/ui/PillNav'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select'
import { PageShell, PageHero } from '@/shared/ui/PageShell'
import { PageState } from '@/shared/ui/PageState'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useTasksPageLogic } from '../hooks/useTasksPageLogic'
import { TasksModals } from '../features/TasksModals'
import { TaskForm } from '../features/manage-task/TaskForm'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRejectTask, useTaskStatusChange } from '../entities/hooks/useTasks'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { PRIORITY_OPTIONS } from '@/shared/lib/priority'
import { TaskListSection } from '../components/TaskListSection'
import { TaskBoardSection } from '../components/TaskBoardSection'
import { TasksRail } from '../components/TasksRail'
import { Skeleton } from '@/shared/ui/Skeleton';
import { useSEO } from '@/shared/seo';

/* ============================================================
   pages/TasksPage.jsx -- org-wide tasks, triage first.
   Data layer = your useTasksPageLogic (fetch, pagination,
   scopes, filters, sort, bulk + quick mutations, permissions)
   consumed as-is; this file only presents it with your shared
   UI components. Modals = your TasksModals + TaskPanel.
   ============================================================ */

const isDone = t => (t.currentStatus || t.status || '').toUpperCase() === 'DONE'
const isReview = t => /REVIEW|SUBMITTED/.test((t.currentStatus || t.status || '').toUpperCase())
const isOpen = t => !isDone(t) && !t.archived

function daysUntil(dateInput) {
  if (!dateInput) return null
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  return Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due', label: 'Due soon' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'done', label: 'Done' },
]

const SCOPES = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'archived', label: 'Archived' },
]

export function TasksPage() {
  const logic = useTasksPageLogic()
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  useSEO({
    title: 'Tasks',
    description: 'Manage, organize, and prioritize team and personal tasks with real-time tracking.',
    ogTitle: 'Tasks | Ryokai',
    noindex: true,
  })
  const navigate = useNavigate()
  const changeTaskStatus = useTaskStatusChange()
  const rejectTaskMutation = useRejectTask()
  const [searchParams] = useSearchParams()
  const urlStatus = searchParams.get('status')
  const isValidStatus = (v) => STATUS_FILTERS.some(f => f.value === v)
  const [statusFilter, setStatusFilter] = useState(isValidStatus(urlStatus) ? urlStatus : 'all')

  // Keep the pill in sync when navigation changes ?status= (e.g. dashboard stat links)
  useEffect(() => {
    if (isValidStatus(urlStatus)) setStatusFilter(urlStatus)
  }, [urlStatus])

  /* ----- presentation derivations over logic.tasks ----- */
  const counts = useMemo(() => {
    const c = { all: logic.tasks.length, open: 0, overdue: 0, due: 0, in_progress: 0, review: 0, done: 0 }
    logic.tasks.forEach(t => {
      if (isDone(t)) c.done += 1
      else if (isReview(t)) c.review += 1
      else if (isOpen(t)) c.in_progress += 1
      const d = daysUntil(t.dueDate)
      if (isOpen(t) && d != null && d < 0) c.overdue += 1
      if (isOpen(t) && d != null && d >= 0 && d <= 2) c.due += 1
    })
    return c
  }, [logic.tasks])

  const visibleTasks = useMemo(() => {
    const f = statusFilter
    if (f === 'all') return logic.tasks
    if (f === 'done') return logic.tasks.filter(isDone)
    if (f === 'review') return logic.tasks.filter(t => !isDone(t) && isReview(t))
    if (f === 'in_progress') return logic.tasks.filter(isOpen)
    if (f === 'overdue') return logic.tasks.filter(t => isOpen(t) && daysUntil(t.dueDate) != null && daysUntil(t.dueDate) < 0)
    if (f === 'due') { const d = daysUntil; return logic.tasks.filter(t => isOpen(t) && d(t.dueDate) != null && d(t.dueDate) >= 0 && d(t.dueDate) <= 2) }
    if (f === 'open') return logic.tasks.filter(isOpen)
    return logic.tasks
  }, [logic.tasks, statusFilter])

  const band = useMemo(() => {
    const overdue = logic.tasks.filter(t => isOpen(t) && daysUntil(t.dueDate) != null && daysUntil(t.dueDate) < 0).length
    const dueSoon = logic.tasks.filter(t => { const d = daysUntil(t.dueDate); return isOpen(t) && d != null && d >= 0 && d <= 7 }).length
    const inProgress = logic.tasks.filter(isOpen).length
    const done = logic.tasks.filter(isDone).length
    const total = logic.tasks.length
    return { overdue, dueSoon, inProgress, completionRate: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [logic.tasks])

  /* ----- status change -- same mapping as your team kanban ----- */
  const handleUpdateTaskStatus = useCallback((task, targetStatus) => {
    const normalized = String(targetStatus || '').toUpperCase().replace(/\s+/g, '_')
    const mapped = normalized === 'IN_REVIEW' || normalized === 'REVIEW'
      ? 'SUBMITTED'
      : (normalized === 'TO_DO' ? 'IN_PROGRESS' : normalized)
    changeTaskStatus(task, mapped)
  }, [changeTaskStatus])

  /* ----- bulk reject -- same flow as your original page ----- */
  const handleBulkReject = useCallback(async () => {
    const reason = await confirm({
      title: 'Send back for rework',
      description: 'What needs to change?',
      requireInput: true,
      inputPlaceholder: 'e.g. Missing criteria...',
      confirmLabel: 'Send back',
      danger: true,
    })
    if (reason === false) return
    let skipped = 0
    logic.selectedTasks.forEach(task => {
      if (task.currentStatus?.toUpperCase() === 'SUBMITTED') rejectTaskMutation.mutate({ id: task.id, reason: reason || 'Rework' })
      else skipped++
    })
    if (skipped > 0) toast.error(skipped + ' task(s) skipped')
    logic.setRowSelection({})
  }, [confirm, logic.selectedTasks, rejectTaskMutation, logic.setRowSelection])

  const handleTaskNavigate = useCallback((task) => {
    navigate(`/app/tasks/${task.id}`, { state: { task } })
  }, [navigate])

  const hasSelection = logic.selectedIds.length > 0
  const viewIsBoard = logic.viewMode !== 'list'

  const SORTS = [
    { value: 'dueDate', label: 'Due date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
    { value: 'updated', label: 'Updated' },
  ]

  return (
    <>
      {confirmDialog}
      <TasksModals
        reassignData={logic.reassignData} setReassignData={logic.setReassignData}
        isBulkAssignOpen={logic.isBulkAssignOpen} setIsBulkAssignOpen={logic.setIsBulkAssignOpen}
        allUsers={logic.allUsers}
        updateTaskMutation={logic.updateTaskMutation}
        onReassignSubmit={logic.handleReassignSubmit}
        onBulkAssign={logic.handleBulkAssign}
      />
{logic.createOpen ? (
      /* Full-page create form */
      <div className="flex-1 min-h-0 flex items-start justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">New Task</h2>
              <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Create a new task for your workspace</p>
            </div>
            <button
              onClick={() => logic.setCreateOpen(false)}
              className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          </div>
          <TaskForm onSubmit={logic.handleCreateTask} isLoading={logic.createTaskMutation.isPending} />
        </div>
      </div>
    ) : (
      <PageShell maxWidth="default">
      <PageHero
      eyebrow={logic.workspaceMode === 'PERSONAL' ? 'Personal' : logic.workspaceMode === 'CREWS' ? 'Crew' : 'Organization'}
      title="Tasks"
      subtitle="Manage, filter, and track your work across all views."
      icon={ListTodo}
      >
      <Button variant="primary" size="sm" className="gap-1.5 h-8 text-[12px] hidden sm:inline-flex" onClick={() => logic.setCreateOpen(true)} data-tour="tasks-new-btn">
      <Plus className="w-3.5 h-3.5" /> New Task
      </Button>
      </PageHero>

      <PageState state={logic.isLoading ? 'loading' : logic.isError ? 'error' : 'ready'} stateProps={{skeleton: <TasksPageSkeleton />,  loadingVariant: 'cards', onRetry: logic.refetch }} moduleId="tasks">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px] gap-4 items-start">
      <div className="min-w-0 space-y-4" data-tour="tasks-first-card">
        {/* Attention band */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 px-3.5 py-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--danger)]/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-[var(--danger)]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[17px] font-bold leading-none tabular-nums">{band.overdue}</p>
          <p className="text-[10.5px] font-semibold text-[var(--text-muted)] mt-1">Overdue</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/5 px-3.5 py-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4 text-[var(--warning)]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[17px] font-bold leading-none tabular-nums">{band.dueSoon}</p>
          <p className="text-[10.5px] font-semibold text-[var(--text-muted)] mt-1">Due soon</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--accent-border)]/60 bg-[var(--accent-soft)]/40 px-3.5 py-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[17px] font-bold leading-none tabular-nums">{band.inProgress}</p>
          <p className="text-[10.5px] font-semibold text-[var(--text-muted)] mt-1">In progress</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-3" title="Completion across all tasks">
        <ProgressRing value={band.completionRate} size={38} strokeWidth={3.5}>
          <span className="text-[10px] font-bold tabular-nums">{band.completionRate}%</span>
        </ProgressRing>
        <div>
          <p className="text-[13px] font-bold leading-none">done</p>
          <p className="text-[10.5px] font-semibold text-[var(--text-muted)] mt-1">{logic.totalCount} total</p>
        </div>
      </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap" data-tour="tasks-filter-bar">
      <div data-tour="tasks-view-toggle">
        <PillNav
          options={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]}
          value={viewIsBoard ? 'board' : 'list'}
          onChange={v => logic.setViewMode(v)}
        />
      </div>
      <div className="w-[135px]">
        <Select value={logic.taskScope} onValueChange={logic.setTaskScope}>
          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent>
        {SCOPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <SearchInput
        value={logic.globalFilter}
        onChange={logic.setGlobalFilter}
        placeholder="Search tasks..."
        debounceMs={0}
        className="w-[180px] sm:w-[230px]"
      />
      <div className="w-[150px]">
        <Select value={logic.sortBy} onValueChange={logic.setSortBy}>
          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent>
        {SORTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {logic.filtersActive && (
        <button onClick={logic.handleClearFilters} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer">
          <X className="w-3 h-3" /> Clear filters
        </button>
      )}
      <span className="ml-auto text-[11.5px] text-[var(--text-muted)] tabular-nums hidden sm:inline">{logic.totalCount} tasks</span>
        </div>

        {/* Premium filter row: priority chips + project + team */}
        <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Priority</span>
      <div className="inline-flex items-center bg-[var(--bg-subtle)] rounded-md p-0.5 border border-[var(--border-subtle)]">
        {PRIORITY_OPTIONS.map(opt => {
          const active = logic.priorityFilter.includes(opt.value)
          return (
        <button key={opt.value}
          onClick={() => logic.setPriorityFilter(prev => active ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
          className={cn('px-2.5 py-1 rounded-sm text-[11px] font-medium border-0 transition-all duration-150 cursor-pointer h-auto select-none whitespace-nowrap',
            active ? 'bg-[var(--bg-card)] shadow-sm text-[var(--accent)]' : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
          {opt.label}
        </button>
          )
        })}
      </div>
      {logic.projectsList.length > 0 && (
        <div className="w-[150px]">
          <Select value={String(logic.projectFilter)} onValueChange={logic.setProjectFilter}>
        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All projects</SelectItem>
          {logic.projectsList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
        </SelectContent>
          </Select>
        </div>
      )}
      {logic.teamsList.length > 0 && (
        <div className="w-[140px]">
          <Select value={String(logic.teamFilter)} onValueChange={logic.setTeamFilter}>
        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All teams</SelectItem>
          {logic.teamsList.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
        </SelectContent>
          </Select>
        </div>
      )}
        </div>

        {/* Status chips */}
        <div className="overflow-x-auto no-scrollbar">
          <PillNav filters={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} counts={counts} />
        </div>

        {/* Views */}
        {viewIsBoard ? (
      <TaskBoardSection
        tasks={visibleTasks}
        onStatusChange={handleUpdateTaskStatus}
        onOpen={handleTaskNavigate}
        canEdit={logic.canEditTask}
      />
        ) : (
      <TaskListSection
        tasks={visibleTasks}
        selectedIds={logic.selectedIds}
        onToggleSelect={id => logic.setRowSelection(prev => {
          const next = { ...prev }
          if (next[id]) delete next[id]
          else next[id] = true
          return next
        })}
        user={logic.user}
        canEdit={logic.canEditTask}
        canDelete={logic.canDeleteTask}
        canAssign={logic.canAssignTask}
        onAssign={task => logic.setReassignData({ id: task.id, title: task.title, description: task.description, priority: task.priority })}
        onComplete={logic.handleQuickComplete}
        onDelete={logic.handleQuickDelete}
        onOpen={handleTaskNavigate}
        hasFilters={logic.searchActive || logic.filtersActive}
        onClearFilters={logic.handleClearFilters}
        onCreateTask={() => logic.setCreateOpen(true)}
      />
        )}

        {/* Pager -- your paginated API */}
        {logic.totalPages > 1 && (
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl">
        <span className="text-[12px] text-[var(--text-tertiary)]">{logic.totalCount} tasks   Page {logic.currentPage + 1} of {logic.totalPages}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={logic.currentPage <= 0} onClick={() => logic.setCurrentPage(p => Math.max(0, p - 1))}> </Button>
          <Button variant="outline" size="sm" disabled={logic.currentPage >= logic.totalPages - 1} onClick={() => logic.setCurrentPage(p => Math.min(logic.totalPages - 1, p + 1))}> </Button>
        </div>
      </div>
        )}
      </div>

      {/* Rail -- week ring + due today/tomorrow */}
      <TasksRail tasks={logic.tasks} onOpen={handleTaskNavigate} />
      </div>
      </PageState>
      </PageShell>
    )}
      {/* Bulk bar -- your bulk mutations */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-3 flex-wrap px-5 py-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)]"
          >
            <Text size="sm" className="text-[13px] font-medium">{logic.selectedIds.length} selected</Text>
            <div className="h-4 w-px bg-[var(--border-subtle)]" />
            <Button variant="ghost" size="sm" onClick={logic.handleBulkComplete} disabled={logic.isBulkPending} className="text-[12px]">{logic.workspaceMode === 'PERSONAL' ? 'Complete' : 'Approve'}</Button>
            {logic.workspaceMode !== 'PERSONAL' && (
              <>
                <Button variant="ghost" size="sm" onClick={logic.handleBulkSubmit} disabled={logic.isBulkPending} className="text-[12px]">Submit</Button>
                <Button variant="ghost" size="sm" onClick={() => logic.setIsBulkAssignOpen(true)} disabled={logic.isBulkPending} className="text-[12px]">Reassign</Button>
                <Button variant="ghost" size="sm" onClick={handleBulkReject} disabled={logic.isBulkPending} className="text-[12px] text-[var(--danger)]">Reject</Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={logic.handleBulkDelete} disabled={logic.isBulkPending} className="text-[12px] text-[var(--danger)]">Delete</Button>
            <Button variant="ghost" size="sm" onClick={() => logic.setRowSelection({})} className="p-1.5"><X className="w-3.5 h-3.5" /></Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile FAB */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={() => logic.setCreateOpen(true)}
        className="sm:hidden fixed bottom-5 right-5 z-40 w-12 h-12 rounded-2xl bg-[var(--accent)] text-white shadow-[var(--shadow-lg)] flex items-center justify-center cursor-pointer"
        title="New task" aria-label="New task"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </motion.button>

    </>
  )
}

export default TasksPage

function TasksPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-12" /><Skeleton className="h-3 w-16" /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px] gap-4 items-start">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-7 w-[135px] rounded-lg" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-3">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
