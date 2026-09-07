import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ListTodo, Users, FolderKanban, ArrowRight, CalendarClock, Activity, Share2 } from 'lucide-react'
import { Heading, Text } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { Avatar, AvatarFallback } from '@/shared/ui/Avatar'
import { ProgressBar, ProgressRing } from '@/shared/ui/Progress'
import { EmptyState } from '@/shared/ui/EmptyState'
import { normalizePriority, PRIORITY_HEX } from '@/shared/lib/priority'

/* ============================================================
   components/OverviewTab.jsx -- project command center.
   Progress + milestones, open-task triage, member contribution
   (gradient bars), and an aside with details / crew access /
   recent activity. Everything derives from the page's real
   project, tasks, contributions and activities.
   ============================================================ */

function hashHue(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h) % 360
}

function daysUntil(dateInput) {
  if (!dateInput) return null
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  return Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

function dueInfo(dateInput) {
  const d = daysUntil(dateInput)
  if (d == null) return null
  if (d < 0) return { label: d === -1 ? 'Overdue' : `${Math.abs(d)}d overdue`, variant: 'danger' }
  if (d === 0) return { label: 'Today', variant: 'warning' }
  if (d <= 7) return { label: `${d}d`, variant: 'warning' }
  return { label: new Date(dateInput).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), variant: 'outline' }
}

const isDone = t => (t.currentStatus || t.status || '').toUpperCase() === 'DONE'

function MilestoneCheck({ done, label }) {
  return (
    <div className="flex items-center gap-2.5 text-[11px]">
      <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] shrink-0 transition-colors ${done ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30' : 'border-[var(--border-default)] text-transparent'}`}>
        {done && '[x]'}
      </span>
      <span className={done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}>{label}</span>
    </div>
  )
}

function SummaryRow({ label, value, suffix = '', tone }) {
  return (
    <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--bg-subtle)]">
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      <span className={`text-[13px] font-bold tabular-nums ${tone === 'success' ? 'text-[var(--success)]' : tone === 'accent' ? 'text-[var(--accent)]' : tone === 'warning' ? 'text-[var(--warning)]' : tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
        {value}<span className="text-[10px] font-normal text-[var(--text-muted)]">{suffix}</span>
      </span>
    </div>
  )
}

export function OverviewTab({
  project,
  taskAnalytics,
  healthScore,
  healthStatus,
  daysRemaining,
  projectTasks,
  teamContributions,
  crewAccess,
  activities = [],
  onManageMembers,
  onOpenTasks,
}) {
  const hue = hashHue(project?.name || 'project')

  const openTasks = useMemo(() => {
    return projectTasks
      .filter(t => !isDone(t) && !t.archived)
      .sort((a, b) => {
        const da = daysUntil(a.dueDate), db = daysUntil(b.dueDate)
        if (da != null && db != null) return da - db
        if (da != null) return -1
        if (db != null) return 1
        return 0
      })
      .slice(0, 5)
  }, [projectTasks])

  const maxContribution = useMemo(() => Math.max(1, ...teamContributions.map(c => c.percentage || c.tasks || 0)), [teamContributions])

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
        {/* Progress + milestones */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] p-5">
          <div className="flex items-center gap-4">
            <ProgressRing value={project.progress || 0} size={80} strokeWidth={5}>
              <span className="text-[16px] font-bold tabular-nums">{project.progress || 0}%</span>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Overall Progress</span>
                <span className="text-[11px] font-bold tabular-nums">{project.progress || 0}%</span>
              </div>
              <ProgressBar value={project.progress || 0} height="h-2" />
              <div className="mt-3 space-y-2">
                <SummaryRow label="Health Score" value={healthScore} suffix="/100" tone={healthStatus.tone} />
                <SummaryRow label="Tasks Done" value={taskAnalytics.done} suffix={` / ${taskAnalytics.total}`} />
                <SummaryRow label="Remaining" value={daysRemaining !== null ? `${daysRemaining} days` : '-'} tone={daysRemaining !== null && daysRemaining <= 3 ? 'danger' : undefined} />
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--border-subtle)] pt-3 mt-4">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5 block">Milestones</span>
            <div className="space-y-2">
              <MilestoneCheck done={projectTasks.length > 0} label={`Tasks initialized (${projectTasks.length})`} />
              <MilestoneCheck done={!!project.dueDate} label="Timeline scheduled" />
              <MilestoneCheck done={teamContributions.length > 0} label="Team assigned" />
            </div>
          </div>
        </div>

        {/* Open tasks triage */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)]">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
            <ListTodo className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.75} />
            <span className="text-[13px] font-bold">Open tasks</span>
            <span className="flex-1" />
            <button onClick={onOpenTasks} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--accent)] hover:underline cursor-pointer">
              Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-2.5">
            {openTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All caught up" description="No open tasks right now." className="min-h-[120px]" />
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {openTasks.map(t => {
                  const due = dueInfo(t.dueDate)
                  const prio = normalizePriority(t.priority)
                  const assignee = typeof t.assignedTo === 'object' ? t.assignedTo?.username : t.assignedTo
                  return (
                    <motion.button
                      key={t.id}
                      onClick={onOpenTasks}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_HEX[prio] || '#9a9ba6' }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-medium truncate">{t.title || 'Untitled task'}</span>
                        {assignee && <span className="block text-[10.5px] text-[var(--text-muted)]">{assignee}</span>}
                      </span>
                      {due && <Badge variant={due.variant} size="sm">{due.label}</Badge>}
                      {assignee && (
                        <Avatar size="xs">
                          <AvatarFallback style={{ background: `linear-gradient(135deg, hsl(${hashHue(assignee)} 72% 52%), hsl(${(hashHue(assignee) + 35) % 360} 68% 38%))`, color: '#fff', fontSize: 9, fontWeight: 700 }}>
                            {assignee.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Team contribution */}
        {teamContributions.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.75} />
              <span className="text-[13px] font-bold">Team Contribution</span>
            </div>
            <div className="space-y-3.5">
              {teamContributions.map(c => {
                const pct = Math.min(100, Math.round(((c.percentage || c.tasks || 0) / maxContribution) * 100))
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="font-medium text-[var(--text-primary)] truncate">{c.name}</span>
                      <span className="text-[var(--text-muted)] font-mono tabular-nums">{c.tasks} ({c.percentage}%)</span>
                    </div>
                    <ProgressBar value={pct} height="h-1.5" glow={false} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Aside */}
      <aside className="space-y-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] p-4">
          <div className="flex items-center gap-2 mb-3 text-[13px] font-bold">
            <FolderKanban className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.75} /> Details
          </div>
          <div className="space-y-3">
            {project.organizationName && <DetailRow label="Organization" value={project.organizationName} />}
            {project.teamName && <DetailRow label="Team" value={project.teamName} />}
            <DetailRow label="Owner" value={project.createdBy || 'System'} />
            {project.dueDate && <DetailRow label="Deadline" value={new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />}
          </div>
        </div>

        {crewAccess && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] p-4">
            <div className="flex items-center gap-2 mb-3 text-[13px] font-bold">
              <Share2 className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.75} /> Crew Access
            </div>
            {crewAccess.list.length === 0 ? (
              <p className="text-[11.5px] text-[var(--text-muted)] py-2">Not shared with any crew.</p>
            ) : (
              <div className="space-y-2">
                {crewAccess.list.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <span className="font-medium text-[12px] truncate">{c.name || `Crew #${c.id}`}</span>
                    {crewAccess.canManage && (
                      <Button size="xs" variant="ghost" className="text-[var(--danger)] hover:bg-[var(--danger-soft)]" onClick={() => crewAccess.onRemove(c.id)}>Remove</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] p-4">
          <div className="flex items-center gap-2 mb-3 text-[13px] font-bold">
            <Activity className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.75} /> Recent Activity
          </div>
          {activities.length === 0 ? (
            <p className="text-[11.5px] text-[var(--text-muted)] py-1">No activity yet ? actions will stream in here.</p>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 4).map((act, idx) => {
                // Backend sends actor as a {id, username} object -- calling
                // .charAt() on it crashed the whole Overview tab.
                const actorName = act.actor?.username || act.username || 'System';
                return (
                <div key={act.id || idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: `hsl(${(hashHue(actorName) + 20) % 360} 65% 48%)` }}>
                    {actorName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
                      <span className="font-semibold text-[var(--text-primary)]">{actorName}</span>{' '}
                      {act.action || act.description || 'performed an action'}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {act.timestamp ? new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] p-4">
          <div className="flex items-center gap-2 mb-3 text-[13px] font-bold">
            <CalendarClock className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.75} /> Timeline
          </div>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {project.dueDate
              ? `Due ${new Date(project.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}   ${daysRemaining !== null ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` : '--'}`
              : 'No deadline set yet.'}
          </p>
        </div>
      </aside>
    </div>
  )
}

function DetailRow({ label, value }) {
  return <div className="flex items-center justify-between text-[12px]"><span className="text-[var(--text-muted)]">{label}</span><span className="font-medium text-[var(--text-primary)] truncate ml-3">{value}</span></div>
}

export default OverviewTab
