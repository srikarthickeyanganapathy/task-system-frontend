import { Skeleton } from '@/shared/ui/Skeleton';
import React, { useMemo } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, parseISO } from 'date-fns'
import { cn } from '@/shared/lib/cn'

function pulseDots(count) {
  if (!count) return null
  const dots = []
  const tiers = count >= 3 ? [6, 5, 4] : count === 2 ? [4, 4] : [4]
  tiers.forEach((size, i) => {
    const opacity = count >= 3 ? [0.95, 0.7, 0.45][i] : count === 2 ? (i === 0 ? 0.85 : 0.5) : 0.6
    dots.push(<i key={i} aria-hidden="true" className="block rounded-full bg-[var(--accent)]" style={{ width: size, height: size, opacity }} />)
  })
  return dots
}

const CalendarDayCell = React.memo(function CalendarDayCell({ day, isCurrentMonth, count, isSelected, onSelectDay }) {
  const today = isToday(day)
  const accessibleLabel = `${format(day, 'EEEE, MMMM d, yyyy')}${count ? `, ${count} scheduled item${count > 1 ? 's' : ''}` : ', no items scheduled'}`

  return (
    <button
      type="button"
      onClick={() => onSelectDay && onSelectDay(day)}
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      aria-current={today ? 'date' : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-[3px] h-[44px] rounded-[10px] border border-transparent transition-all cursor-pointer hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
        !isCurrentMonth && "opacity-30",
        isSelected && "bg-[var(--accent-soft)] border-[var(--accent-border)]"
      )}
    >
      <div className={cn(
        "relative flex items-center justify-center w-[18px] h-[18px] rounded-full",
        today && "bg-[var(--accent)]"
      )}>
        <span 
          className={cn(
            "font-mono text-[10.5px] leading-none",
            today ? "text-[var(--text-on-accent)] font-bold" : "text-[var(--text-secondary)]"
          )}
        >
          {format(day, 'd')}
        </span>
      </div>
      <div className="flex items-center gap-[2.5px] h-[6px]" aria-hidden="true">
        {pulseDots(count)}
      </div>
    </button>
  )
})

function MonthViewComponent({ tasks = [], events = [], currentDate, isLoading, onSelectDay, selectedDay }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const tasksByDate = useMemo(() => {
    const map = {}
    tasks.forEach(task => { if (task.dueDate) { const k = format(parseISO(task.dueDate), 'yyyy-MM-dd'); if (!map[k]) map[k] = []; map[k].push(task) } })
    return map
  }, [tasks])

  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(ev => { if (ev.startTime) { const k = format(parseISO(ev.startTime), 'yyyy-MM-dd'); if (!map[k]) map[k] = []; map[k].push(ev) } })
    return map
  }, [events])

  const dayCounts = useMemo(() => {
    const counts = {}
    days.forEach(d => { const k = format(d, 'yyyy-MM-dd'); counts[k] = (tasksByDate[k]?.length || 0) + (eventsByDate[k]?.length || 0) })
    return counts
  }, [days, tasksByDate, eventsByDate])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-2 p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr min-h-[400px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-full min-h-[80px] w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm px-3.5 pt-4 pb-3 min-w-[640px] sm:min-w-0">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-[10px] font-bold tracking-[0.13em] uppercase text-[var(--text-tertiary)]">Month pulse</span>
        <span className="font-mono text-[9.5px] text-[var(--text-tertiary)]">dot size = activity</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-7 gap-1 pb-1.5">
          {weekDays.map((day, i) => (
            <div key={day} className={cn(
              "text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--text-tertiary)] text-center",
              (i === 0 || i === 6) && "opacity-65"
            )}>
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, rIndex) => (
          <div key={rIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const isSelected = selectedDay ? format(selectedDay, 'yyyy-MM-dd') === dateKey : false
              return (
                <CalendarDayCell
                  key={day.toISOString()}
                  day={day}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  count={dayCounts[dateKey] || 0}
                  isSelected={isSelected}
                  onSelectDay={onSelectDay}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export const MonthView = React.memo(MonthViewComponent)


