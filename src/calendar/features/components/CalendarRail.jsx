import React, { useMemo } from 'react'
import { format, isAfter, isBefore, isSameDay, parseISO, startOfToday, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { CalendarDays, Sparkles } from '@/shared/ui/Icons'
import { cn } from '@/shared/lib/cn'

const UpNextItem = React.memo(function UpNextItem({ item, onClick }) {
  const isEvent = item.__type === 'event'
  const date = parseISO(isEvent ? item.startTime : item.dueDate)
  const timeLabel = isEvent ? (item.isAllDay ? 'All day' : format(date, 'h:mm a')) : format(date, 'h:mm a')
  const dateLabel = format(date, 'EEE d')

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)] cursor-pointer transition-colors text-left w-full hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:z-10 last:border-b-0"
    >
      <i 
        aria-hidden="true"
        className={cn(
          "w-[7px] h-[7px] rounded-[2px] shrink-0",
          isEvent ? "bg-[var(--accent)]" : "bg-[var(--warning)]"
        )} 
      />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-[var(--text-primary)] truncate">
          {item.title}
        </div>
        <div className="font-mono text-[9px] text-[var(--text-tertiary)] mt-0.5">
          {dateLabel} · {timeLabel}
        </div>
      </div>
      <span className="font-mono text-[9px] text-[var(--text-tertiary)] shrink-0">
        {timeLabel}
      </span>
    </button>
  )
})

function CalendarRailComponent({ tasks = [], events = [], onTaskClick, onEventClick }) {
  const today = startOfToday()
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)

  const { upNext, eventsThisWeek } = useMemo(() => {
    const pendingTasks = tasks.filter(t => t.dueDate && t.status !== 'Done').map(t => ({ ...t, __type: 'task', date: parseISO(t.dueDate) }))
    const validEvents = events.filter(e => e.startTime).map(e => ({ ...e, __type: 'event', date: parseISO(e.startTime) }))
    
    const allItems = [...pendingTasks, ...validEvents].sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Up next: next 6 items in the next 14 days
    const horizon = addDays(today, 14)
    const upcoming = allItems.filter(item => 
      (isAfter(item.date, today) || isSameDay(item.date, today)) && isBefore(item.date, horizon)
    ).slice(0, 6)

    // Events this week
    const weekEventsCount = validEvents.filter(e => 
      !isBefore(e.date, weekStart) && !isAfter(e.date, weekEnd)
    ).length

    return { upNext: upcoming, eventsThisWeek: weekEventsCount }
  }, [tasks, events, today, weekStart, weekEnd])

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Up Next Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="text-[10px] font-bold tracking-[0.13em] uppercase text-[var(--text-tertiary)]">
            Up next
          </span>
        </div>
        <div className="flex flex-col">
          {upNext.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--text-tertiary)] opacity-60" />
              </div>
              <span className="text-[11.5px] font-medium text-[var(--text-secondary)]">All caught up</span>
              <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">No upcoming items.</span>
            </div>
          ) : (
            upNext.map(item => (
              <UpNextItem 
                key={`${item.__type}-${item.id}`} 
                item={item} 
                onClick={(it) => it.__type === 'event' ? onEventClick?.(it) : onTaskClick?.(it)} 
              />
            ))
          )}
        </div>
      </div>

      {/* Focus / Events this week Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1]">
              {eventsThisWeek}
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-[var(--text-tertiary)] font-semibold mt-px">
              Events this week
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CalendarRail = React.memo(CalendarRailComponent)

