import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, TrendingUp, Timer, Target, Users, FolderKanban, PieChart } from 'lucide-react'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PillNav } from '@/shared/ui/PillNav'
import { cn } from '@/shared/lib/cn'

/* ============================================================
   components/InsightsTab.jsx -- derived analytics (demo layout)
   + rich fragments (throughput / cycle time / forecast).
   Every number is computed from the real teamTasks / teamProjects
   inside a 14d / 30d / quarter window. No mocked metrics.
   CSV export is a client-side blob of the visible tables.
   ============================================================ */

const RANGES = [
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
  { value: 'quarter', label: 'Quarter' },
]

const isDone = t => {
  const s = (t.currentStatus || t.status || '').toUpperCase()
  return s === 'DONE' || s === 'COMPLETED'
}

function statusOf(t) {
  const s = (t.currentStatus || t.status || 'TODO').toUpperCase()
  if (s === 'DONE' || s === 'COMPLETED') return 'DONE'
  if (s === 'REVIEW' || s === 'SUBMITTED') return 'REVIEW'
  if (s === 'IN_PROGRESS' || s === 'DOING') return 'IN_PROGRESS'
  return 'TODO'
}

const STATUS_META = {
  DONE: { label: 'Done', color: 'var(--success)' },
  IN_PROGRESS: { label: 'In progress', color: 'var(--accent)' },
  REVIEW: { label: 'In review', color: 'var(--warning)' },
  TODO: { label: 'To do', color: 'var(--border-default)' },
}

function hashHue(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h) % 360
}

function InsightRow({ label, value, pct, color, valueSuffix = '', labelIcon }) {
  return (
    <div className="flex items-center gap-2.5">
      {labelIcon}
      <span className="min-w-[86px] max-w-[86px] truncate text-[11.5px] font-medium text-[var(--text-secondary)]">{label}</span>
      <div className="flex-1 h-[6px] rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 0)}%`, background: color }} />
      </div>
      <span className="w-[52px] text-right text-[11.5px] font-bold tabular-nums text-[var(--text-primary)]">
        {value} <span className="text-[10px] font-medium text-[var(--text-muted)]">{valueSuffix}</span>
      </span>
    </div>
  )
}

function Card({ icon: Icon, title, children }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        <Icon className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.75} />
        <Heading level={4} className="text-[12.5px] font-bold">{title}</Heading>
      </header>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  )
}

function StatTile({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] px-4 py-3">
      <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        tone === 'success' ? 'bg-[var(--success-soft)] text-[var(--success)]' : tone === 'warning' ? 'bg-[var(--warning-soft)] text-[var(--warning)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]')}>
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-[17px] font-bold leading-none tabular-nums">{value}</span>
        <span className="block text-[10.5px] font-semibold text-[var(--text-muted)] mt-1">{label}</span>
        {hint && <span className="block text-[9.5px] text-[var(--text-muted)] opacity-80 mt-0.5 truncate">{hint}</span>}
      </span>
    </div>
  )
}

export function InsightsTab({ teamTasks = [], teamProjects = [], insights }) {
  const [range, setRange] = useState('30d')

  const windowMs = useMemo(() => {
    if (range === '14d') return 14 * 86400000
    if (range === '30d') return 30 * 86400000
    return 92 * 86400000
  }, [range])

  const inWindow = useMemo(() => {
    const cutoff = Date.now() - windowMs
    return t => {
      const ts = t.updatedAt || t.createdAt || t.completedAt
      if (!ts) return true
      const d = new Date(ts).getTime()
      return !isNaN(d) && d >= cutoff
    }
  }, [windowMs])

  const windowTasks = useMemo(() => teamTasks.filter(inWindow), [teamTasks, inWindow])

  const statusDist = useMemo(() => {
    const base = { DONE: 0, IN_PROGRESS: 0, REVIEW: 0, TODO: 0 }
    windowTasks.forEach(t => { base[statusOf(t)] += 1 })
    return base
  }, [windowTasks])

  /* ---- trend: tasks completed per day ---- */
  const trend = useMemo(() => {
    const numDays = range === '14d' ? 14 : range === '30d' ? 30 : Math.floor(windowMs / 86400000)
    const displayDays = Math.min(numDays, 30) // Cap at 30 days for layout
    const days = Array.from({ length: displayDays }, (_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (displayDays - 1 - i))
      return { day: d, count: 0 }
    })
    const dayIndex = new Map(days.map((d, i) => [d.day.toDateString(), i]))
    windowTasks.forEach(t => {
      if (!isDone(t)) return
      const ts = t.completedAt || t.updatedAt || t.createdAt
      if (!ts) return
      const d = new Date(ts); d.setHours(0, 0, 0, 0)
      const idx = dayIndex.get(d.toDateString())
      if (idx != null) days[idx].count += 1
    })
    return { days, displayDays }
  }, [windowTasks, range, windowMs])

  /* ---- member workload (top 6) ---- */
  const memberLoad = useMemo(() => {
    const map = {}
    windowTasks.forEach(t => {
      const who = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignee?.username || t.assignedTo?.username
      if (!who) return
      map[who] = (map[who] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [windowTasks])

  /* ---- project progress (top 5) ---- */
  const projectProgress = useMemo(() => {
    return teamProjects.slice(0, 5).map(p => {
      const pt = teamTasks.filter(t => String(t.projectId) === String(p.id))
      const done = pt.filter(isDone).length
      const progress = typeof p.progress === 'number' ? p.progress : (pt.length ? Math.round(done / pt.length * 100) : 0)
      return { name: p.name, progress, hue: hashHue(p.name) }
    })
  }, [teamProjects, teamTasks])

  /* ---- rich fragments: throughput / cycle time / forecast ---- */
  const velocity = useMemo(() => {
    const doneTasks = windowTasks.filter(isDone)
    const days = windowMs / 86400000
    const throughput = doneTasks.length / days
    const cycleTimes = doneTasks
      .map(t => {
        const start = t.createdAt ? new Date(t.createdAt).getTime() : null
        const end = t.completedAt || t.updatedAt
        if (!start || !end) return null
        const e = new Date(end).getTime()
        if (isNaN(start) || isNaN(e) || e < start) return null
        return (e - start) / 86400000
      })
      .filter(v => v != null)
    const cycleTime = cycleTimes.length ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : null
    const remaining = windowTasks.filter(t => !isDone(t)).length
    const forecastDays = throughput > 0 ? Math.round(remaining / throughput) : null
    return { throughput, cycleTime, remaining, forecastDays, done: doneTasks.length }
  }, [windowTasks, windowMs])

  const totalStatus = Object.values(statusDist).reduce((a, b) => a + b, 0)
  const maxTrend = Math.max(...trend.days.map(d => d.count), 1)
  const maxLoad = memberLoad.length ? memberLoad[0][1] : 0

  const exportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['window', range],
      ['tasks_in_window', windowTasks.length],
      ['completion_rate_pct', totalStatus ? Math.round(statusDist.DONE / totalStatus * 100) : 0],
      ['throughput_per_day', velocity.throughput.toFixed(2)],
      ['avg_cycle_time_days', velocity.cycleTime != null ? velocity.cycleTime.toFixed(1) : 'n/a'],
      ['forecast_days_to_done', velocity.forecastDays ?? 'n/a'],
      ...Object.entries(statusDist).map(([k, v]) => [`status_${k}`, v]),
      ...trend.days.map(d => [`completed_${d.day.toISOString().slice(0, 10)}`, d.count]),
      ...memberLoad.map(([name, count]) => [`member_${name}`, count]),
      ...projectProgress.map(p => [`project_${p.name}`, `${p.progress}%`]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-insights-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completionRate = totalStatus ? Math.round(statusDist.DONE / totalStatus * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <PillNav options={RANGES} value={range} onChange={setRange} />
        <span className="text-[11px] text-[var(--text-secondary)]">Derived live from team tasks & projects ? no mocked metrics.</span>
        <span className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={exportCsv}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {teamTasks.length === 0 && teamProjects.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)]">
          <EmptyState icon={BarChart3} title="Nothing to analyze yet" description="Task and project data will appear here as work happens." className="min-h-[200px]" />
        </div>
      ) : (
        <>
          {/* Rich fragments: velocity strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatTile icon={TrendingUp} label="Throughput" value={velocity.throughput.toFixed(1)} hint={`${velocity.done} tasks done in window`} />
            <StatTile icon={Timer} label="Avg cycle time" value={velocity.cycleTime != null ? `${velocity.cycleTime.toFixed(1)}d` : '?'} hint={velocity.cycleTime != null ? 'created ? done' : 'not enough data yet'} tone={velocity.cycleTime != null && velocity.cycleTime > 7 ? 'warning' : 'accent'} />
            <StatTile icon={Target} label="Forecast" value={velocity.forecastDays != null ? `${velocity.forecastDays}d` : '--'} hint={velocity.forecastDays != null ? `${velocity.remaining} tasks left at current pace` : 'not enough data yet'} tone={velocity.forecastDays != null && velocity.forecastDays > 14 ? 'warning' : 'success'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status distribution */}
            <Card icon={PieChart} title="Status distribution">
              {Object.entries(statusDist).map(([k, v]) => (
                <InsightRow key={k} label={STATUS_META[k].label} value={v}
                  valueSuffix={totalStatus ? `${Math.round(v / totalStatus * 100)}%` : ''}
                  pct={totalStatus ? v / totalStatus * 100 : 0} color={STATUS_META[k].color} />
              ))}
            </Card>

            {/* Completion trend */}
            <Card icon={BarChart3} title="Completion trend">
              <div className="flex items-end gap-1 h-[84px]">
                {trend.days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full rounded-[3px] transition-all"
                      style={{ height: `${Math.max(d.count / maxTrend * 100, d.count > 0 ? 4 : 1.5)}%`,
                        background: d.count === 0 ? 'var(--bg-subtle)' : 'linear-gradient(180deg, hsl(265 70% 60%), hsl(300 65% 45%))' }} />
                    <span className="text-[8.5px] text-[var(--text-muted)]">{d.day.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{maxTrend} completed in one day   last {trend.displayDays} days</p>
            </Card>

            {/* Member workload */}
            <Card icon={Users} title="Member workload">
              {memberLoad.length === 0 ? (
                <p className="text-[11.5px] text-[var(--text-muted)] py-2">No assigned tasks in this window.</p>
              ) : memberLoad.map(([name, count]) => (
                <InsightRow key={name} label={name.split(' ')[0]} value={count}
                  pct={maxLoad ? count / maxLoad * 100 : 0}
                  color={maxLoad && count / maxLoad >= 0.8 ? 'linear-gradient(90deg,#f2555c,#dc3d43)' : 'var(--accent)'}
                  labelIcon={
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                      style={{ background: `hsl(${hashHue(name)} 65% 48%)` }}>
                      {name.charAt(0).toUpperCase()}
                    </span>
                  } />
              ))}
            </Card>

            {/* Project progress */}
            <Card icon={FolderKanban} title="Project progress">
              {projectProgress.length === 0 ? (
                <p className="text-[11.5px] text-[var(--text-muted)] py-2">No projects yet.</p>
              ) : projectProgress.map(p => (
                <InsightRow key={p.name} label={p.name} value={`${p.progress}%`}
                  pct={p.progress} color={`hsl(${p.hue} 65% 50%)`} />
              ))}
            </Card>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default InsightsTab
