import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, Bell, LayoutDashboard, LayoutGrid, CheckCircle2, Timer, BarChart3,
  GitPullRequest, GitBranch, Paperclip,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { GalaxyCanvas } from '@/shared/ui/GalaxyCanvas'

const AUTOPLAY_MS = 4200

/* The stage is designed once at a fixed size and uniformly scaled to fit
   the panel -- so every device sees the exact same composition. */
const DESIGN_W = 640
const DESIGN_H = 740

function Chip({ children, color }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-[1.5px] font-mono text-[6.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 26%, transparent)`,
      }}
    >
      {children}
    </span>
  )
}

const labelCls = 'font-mono text-[7px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]'

/* --- Mini application demos -- every screen filled edge to edge --- */

const DEMOS = [
  {
    id: 'dashboard',
    label: 'Mission Control',
    quote: 'Every task, every crew -- one calm home.',
    color: 'var(--info)',
    icon: LayoutDashboard,
    render: () => (
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-3 gap-1.5">
          {[['12', 'Active', 'var(--text-primary)'], ['03', 'Due soon', 'var(--warning)'], ['87%', 'Done', 'var(--success)']].map(([v, l, c]) => (
            <div key={l} className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-2 py-1.5">
              <p className="font-mono text-[13px] font-bold leading-none tabular-nums" style={{ color: c }}>{v}</p>
              <p className="mt-1 text-[6.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{l}</p>
            </div>
          ))}
        </div>
        <p className={cn(labelCls, 'mb-1.5 mt-3')}>My queue   7</p>
        <div className="flex flex-1 flex-col justify-between">
          {[
            ['Ship auth flow', 'doing', 'var(--warning)'],
            ['Review API keys', 'open', 'var(--info)'],
            ['Fix webhook retry', 'overdue', 'var(--danger)'],
            ['Update onboarding', 'done', 'var(--success)'],
            ['Migrate billing flags', 'open', 'var(--info)'],
            ['Polish empty states', 'doing', 'var(--warning)'],
            ['Write release notes', 'todo', 'var(--text-tertiary)'],
          ].map(([t, s, c]) => (
            <div key={t} className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-2 py-[6px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} />
              <span className="flex-1 truncate text-[8.5px] text-[var(--text-secondary)]">{t}</span>
              <span className="font-mono text-[6.5px] uppercase tracking-[0.1em]" style={{ color: c }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'crews',
    label: 'Crew Boards',
    quote: 'My crew finally ships as one.',
    color: 'var(--accent-secondary)',
    icon: LayoutGrid,
    render: () => (
      <div className="grid h-full grid-cols-3 gap-1.5">
        {[
          ['To do', 4, [['Design tokens', 'var(--info)'], ['Fix nav overlap', 'var(--danger)'], ['Empty states pass', 'var(--info)'], ['Share spec', 'var(--text-tertiary)']]],
          ['Doing', 3, [['Sync engine', 'var(--warning)'], ['Review queue', 'var(--warning)'], ['Load tests', 'var(--warning)']]],
          ['Done', 4, [['Auth flow', 'var(--success)'], ['Write tests', 'var(--success)'], ['Update deps', 'var(--success)'], ['Clean logs', 'var(--success)']]],
        ].map(([name, count, items]) => (
          <div key={name} className="flex flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 p-1.5">
            <p className="px-0.5 font-mono text-[6.5px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{name}   {count}</p>
            <div className="mt-1 flex flex-1 flex-col justify-between">
              {items.map(([t, c]) => (
                <div key={t} className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5">
                  <p className="truncate text-[8px] font-medium text-[var(--text-secondary)]">{t}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="h-[3px] w-3.5 rounded-full" style={{ background: c }} />
                    <span className="h-[3px] w-2 rounded-full bg-[var(--border-strong)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'reviews',
    label: 'Reviews',
    quote: 'Approvals arrive with the proof attached.',
    color: 'var(--success)',
    icon: CheckCircle2,
    render: () => (
      <div className="flex h-full flex-col">
        <p className={cn(labelCls, 'mb-1.5')}>Pending your approval   7</p>
        <div className="flex flex-1 flex-col justify-between">
          {[['Onboarding revamp', 'approved'], ['Q3 roadmap brief', 'approved'], ['Billing migration', 'pending'], ['Mobile nav spec', 'pending'], ['Crew calendar sync', 'pending'], ['Design audit', 'approved'], ['API docs update', 'pending']].map(([t, s]) => {
            const c = s === 'approved' ? 'var(--success)' : 'var(--warning)'
            return (
              <div key={t} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-2 py-[7px]">
                <CheckCircle2 size={11} strokeWidth={1.75} style={{ color: c }} />
                <span className="flex-1 truncate text-[8.5px] font-medium text-[var(--text-secondary)]">{t}</span>
                <span className="font-mono text-[6.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: c }}>{s}</span>
                <Paperclip size={9} strokeWidth={1.75} className="text-[var(--text-tertiary)]" />
              </div>
            )
          })}
        </div>
        <p className={cn(labelCls, 'mt-1.5 text-center')}>evidence attached   approvals logged</p>
      </div>
    ),
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    quote: 'Deep work on demand, noise off.',
    color: 'var(--warning)',
    icon: Timer,
    render: () => (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative h-[96px] w-[96px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-subtle)" strokeWidth="7" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--warning)" strokeWidth="7" strokeLinecap="round" strokeDasharray="199 277" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-[19px] font-bold tabular-nums text-[var(--text-primary)]">24:37</p>
            <p className="font-mono text-[6.5px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">remaining</p>
          </div>
        </div>
        <p className="mt-3 max-w-[200px] truncate text-center text-[8.5px] text-[var(--text-secondary)]">Refactor sync engine ? deep work</p>
        <span
          className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] font-mono text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{
            color: 'var(--warning)',
            background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
            borderColor: 'color-mix(in srgb, var(--warning) 26%, transparent)',
          }}
        >
          <span className="h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--warning)' }} />
          Focusing
        </span>
        <div className="mt-4 flex items-center gap-1.5">
          <Chip color="var(--warning)">Streak 12d</Chip>
          <Chip color="var(--success)">Today 3/4</Chip>
          <Chip color="var(--info)">Blocked 0</Chip>
        </div>
      </div>
    ),
  },
  {
    id: 'realtime',
    label: 'Realtime',
    quote: 'Everything syncs before I blink.',
    color: 'var(--accent)',
    icon: CheckCircle2,
    render: () => (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col justify-between">
          {[['AC', 'Amara', 'now', true], ['DR', 'Diego', '2m', false], ['PN', 'Priya', '6m', false], ['MB', 'Marcus', '9m', false], ['JR', 'Jonas', '12m', false]].map(([ini, name, t, live]) => (
            <div key={name} className="flex items-start gap-2">
              <span
                className="mt-[2px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[7px] font-bold"
                style={{ background: 'color-mix(in srgb, var(--info) 15%, transparent)', color: 'var(--info)' }}
              >
                {ini}
              </span>
              <div className="flex-1 rounded-lg rounded-tl-sm border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-[8px] font-semibold text-[var(--text-secondary)]">{name}</p>
                  {live && <span className="h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--accent)' }} />}
                  <p className="ml-auto font-mono text-[6.5px] text-[var(--text-tertiary)]">{t}</p>
                </div>
                <div className="mt-1 h-[4px] w-[88%] rounded bg-[var(--border-strong)]" />
                <div className="mt-[3px] h-[4px] w-[58%] rounded bg-[var(--border-subtle)]" />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pl-7">
            {[0, 1, 2].map((d) => (
              <span key={d} className="h-1 w-1 animate-pulse rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: `${d * 0.2}s` }} />
            ))}
            <span className="font-mono text-[6.5px] text-[var(--text-tertiary)]">Sofia is typing...</span>
          </div>
        </div>
        <p className={cn(labelCls, 'mt-1.5 text-center')}>synced across every device</p>
      </div>
    ),
  },
  {
    id: 'github',
    label: 'Integrations',
    quote: 'The merge closes the task. Automatically.',
    color: 'var(--text-secondary)',
    icon: GitPullRequest,
    render: () => (
      <div className="flex h-full flex-col">
        <p className={cn(labelCls, 'mb-1.5')}>Linked activity   ryokai/ryokai</p>
        <div
          className="flex items-center gap-2 rounded-lg border px-2 py-[7px]"
          style={{
            borderColor: 'color-mix(in srgb, var(--success) 26%, transparent)',
            background: 'color-mix(in srgb, var(--success) 8%, transparent)',
          }}
        >
          <GitPullRequest size={11} strokeWidth={1.75} style={{ color: 'var(--success)' }} />
          <span className="font-mono text-[8px] font-semibold text-[var(--text-secondary)]">#482</span>
          <span className="flex-1 truncate text-[8.5px] text-[var(--text-secondary)]">Fix onboarding funnel</span>
          <span className="font-mono text-[6.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--success)' }}>merged</span>
        </div>
        <div className="mt-1.5 flex flex-1 flex-col justify-between">
          {[['a3f9c21', 'Refactor auth guards', '2h'], ['7d02e4b', 'Add retry backoff', '5h'], ['b91cc08', 'Tidy focus timer', '1d'], ['e44a17f', 'Speed up sync layer', '2d'], ['9a2f5d3', 'Board drag polish', '3d'], ['c07d952', 'Dot galaxy logo', '4d']].map(([h, m, t]) => (
            <div key={h} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-2 py-[6px]">
              <GitBranch size={10} strokeWidth={1.75} className="text-[var(--text-tertiary)]" />
              <span className="font-mono text-[7.5px] text-[var(--info)]">{h}</span>
              <span className="flex-1 truncate text-[8.5px] text-[var(--text-secondary)]">{m}</span>
              <span className="font-mono text-[6.5px] text-[var(--text-tertiary)]">{t}</span>
            </div>
          ))}
        </div>
        <p className={cn(labelCls, 'mt-1.5 text-center')}>commits linked to tasks</p>
      </div>
    ),
  },
  {
    id: 'deadlines',
    label: 'Deadlines',
    quote: 'Deadlines never ambush us anymore.',
    color: 'var(--danger)',
    icon: LayoutGrid,
    render: () => (
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-7 gap-1">
          {[
            ['M', null], ['T', 'var(--info)'], ['W', 'var(--danger)'], ['T', 'var(--warning)'],
            ['F', 'var(--info)'], ['S', null], ['S', 'var(--success)'],
          ].map(([l, c], idx) => (
            <div key={idx} className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 py-1.5 text-center">
              <p className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{l}</p>
              <span
                className="mx-auto mt-1 block h-[7px] w-[7px] rounded-[2px]"
                style={{ background: c || 'transparent', border: c ? 'none' : '1px solid var(--border-subtle)' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <Chip color="var(--danger)">3 overdue</Chip>
          <Chip color="var(--info)">5 due this week</Chip>
          <Chip color="var(--success)">87% on time</Chip>
        </div>
        <p className={cn(labelCls, 'mb-1.5 mt-3')}>Coming up</p>
        <div className="flex flex-1 flex-col justify-between">
          {[
            ['Billing migration', 'tomorrow', 'var(--danger)'],
            ['Q3 roadmap brief', 'Thu', 'var(--warning)'],
            ['Mobile nav spec', 'next week', 'var(--info)'],
            ['Design audit', 'Fri', 'var(--warning)'],
          ].map(([t, d, c]) => (
            <div key={t} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-2 py-[7px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} />
              <span className="flex-1 truncate text-[8.5px] text-[var(--text-secondary)]">{t}</span>
              <span className="font-mono text-[6.5px] uppercase tracking-[0.1em]" style={{ color: c }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    quote: 'Signals from real work, not vibes.',
    color: 'var(--logo-arm-2)',
    icon: BarChart3,
    render: () => (
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-3 gap-1.5">
          {[['87%', 'Completion', 'var(--success)'], ['+6%', 'This month', 'var(--info)'], ['-38%', 'Overdue', 'var(--warning)']].map(([v, l, c]) => (
            <div key={l} className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-2 py-1.5">
              <p className="font-mono text-[13px] font-bold leading-none tabular-nums" style={{ color: c }}>{v}</p>
              <p className="mt-1 text-[6.5px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-1 items-end gap-1.5">
          {[34, 48, 42, 61, 55, 74, 68, 92].map((h, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: `${h}%`,
                background: 'linear-gradient(180deg, var(--logo-arm-2), color-mix(in srgb, var(--success) 45%, transparent))',
                opacity: 0.9,
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 border-t border-[var(--border-subtle)] pt-1 text-center font-mono text-[6.5px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          completion   last 8 weeks
        </div>
      </div>
    ),
  },
]

/* --- The hero card -- a miniature of the real application shell --- */

function HeroCard({ demo, index }) {
  return (
    <div className="relative z-10 -translate-y-8 w-[470px] overflow-hidden rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-elevated)]/75 shadow-[var(--shadow-xl)] backdrop-blur-xl">
      {/* Signature hairline in the active demo's color */}
      <div
        className="h-[2.5px] transition-all duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${demo.color}, transparent)` }}
      />

      {/* Window topbar -- search-first, exactly as drawn */}
      <div className="flex h-10 items-center gap-2.5 border-b border-[var(--border-subtle)] px-3">
        <div className="flex h-[22px] flex-1 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-2">
          <Search size={9} strokeWidth={2} className="text-[var(--text-tertiary)]" />
          <span className="text-[8px] text-[var(--text-tertiary)]">Search</span>
        </div>
        <LayoutGrid size={11} strokeWidth={1.75} className="shrink-0 text-[var(--text-tertiary)]" />
        <div className="relative shrink-0">
          <Bell size={11} strokeWidth={1.75} className="text-[var(--text-tertiary)]" />
          <span className="absolute -right-0.5 -top-0.5 h-1 w-1 rounded-full" style={{ background: 'var(--danger)' }} />
        </div>
      </div>

      {/* Body -- demo content edge to edge, no sidebar */}
      <div className="relative h-[360px] p-3.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={demo.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {demo.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer -- label + position (no controls; the galaxy tells you where you are) */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3.5 py-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={demo.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: demo.color }}
          >
            {demo.label}
          </motion.span>
        </AnimatePresence>
        <span className="font-mono text-[8px] tabular-nums tracking-[0.2em] text-[var(--text-tertiary)]">
          {String(index + 1).padStart(2, '0')} / {String(DEMOS.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

/* --- Stage -- one fixed composition, uniformly scaled to any panel --- */

export function AuthDemoStage() {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(0.8)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % DEMOS.length), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) setScale(Math.min(w / DESIGN_W, h / DESIGN_H))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  const demo = DEMOS[index]

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 flex flex-col items-center"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Quote heading -- pb reserves room for the hero card's upward lift */}
        <div className="relative z-20 flex min-h-[48px] w-full max-w-[380px] items-end justify-center pb-10 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={demo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="m-0 text-[17px] font-semibold leading-[1.4] tracking-[-0.01em] text-[var(--text-primary)]"
            >
              <span className="text-[21px] leading-none align-middle transition-colors duration-500" style={{ color: demo.color }}>&ldquo;</span>
              {demo.quote}
              <span className="text-[21px] leading-none align-middle transition-colors duration-500" style={{ color: demo.color }}>&rdquo;</span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Card stack over the galaxy */}
        <div className="relative">
          {/* Soft ambient glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-64 w-[30rem] max-w-none -translate-x-1/2 -translate-y-[30%] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, var(--accent-soft), transparent 70%)' }}
          />

          {/* The spiral galaxy -- centered on the card's bottom edge, so exactly
              half peeks out beneath the hero card; spins with the carousel */}
          <GalaxyCanvas
            spinKey={index}
            className="absolute left-1/2 z-0 w-[620px] max-w-none -translate-x-1/2 opacity-80"
            style={{ top: 'calc(50% - 52px)', height: 470 }}
          />

          {/* Shooting stars */}
          <span className="shooting-star" style={{ top: '5%', left: '56%' }} />
          <span className="shooting-star" style={{ top: '16%', left: '84%', animationDuration: '15s', animationDelay: '6s' }} />

          {/* The one hero card -- the sole card in the composition */}
          <HeroCard demo={demo} index={index} />
        </div>
      </div>
    </div>
  )
}
