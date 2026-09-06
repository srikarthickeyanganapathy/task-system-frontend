import { Skeleton } from '@/shared/ui/Skeleton';
import React, { useMemo } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, parseISO } from 'date-fns'
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

const WeekChip = React.memo(function WeekChip({ item, onClick }) {
  const isEvent = item.__type === 'event'
  const time = isEvent
    ? item.isAllDay ? '' : format(parseISO(item.startTime), 'HH:mm')
    : item.dueDate ? format(parseISO(item.dueDate), 'HH:mm') : ''
  
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(item) }}
      className={cn(
        "flex items-baseline gap-1.5 px-2 py-1 rounded-[6px] text-[9.5px] cursor-pointer transition-colors min-w-0 border-l-[2px] text-left w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
        isEvent 
          ? "bg-[var(--bg-elevated)] border-solid border-[var(--accent)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          : "bg-transparent border-dashed border-[var(--warning)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      {time && <span className="font-mono text-[8px] text-[var(--text-tertiary)] shrink-0">{time}</span>}
      <span className="truncate font-medium min-w-0 flex-1">{item.title}</span>
    </button>
  )
})

const PulseColumn = React.memo(function PulseColumn({ day, items, count, isSelected, onSelectDay, onItemClick }) {
  const today = isToday(day)
  const accessibleLabel = `${format(day, 'EEEE, MMMM d, yyyy')}${count ? `, ${count} scheduled item${count > 1 ? 's' : ''}` : ', clear'}`

  return (
    <div
      className={cn(
        "flex flex-col border border-transparent rounded-xl px-2 py-2.5 transition-colors min-w-0 text-left",
        "hover:bg-[var(--bg-hover)]",
        isSelected && "bg-[var(--accent-soft)] border-[var(--accent-border)]"
      )}
    >
      <button
        type="button"
        onClick={() => onSelectDay(day)}
        aria-label={accessibleLabel}
        aria-pressed={isSelected}
        aria-current={today ? 'date' : undefined}
        className="flex flex-row items-center justify-center gap-1.5 py-0.5 pb-2 mb-2 border-b border-[var(--border-subtle)] w-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded-lg"
      >
        <span className="text-[8.5px] font-bold tracking-[0.1em] uppercase text-[var(--text-tertiary)]">{format(day, 'EEE')}</span>
        <span 
          className={cn(
            "font-mono text-[17px] font-semibold leading-none relative flex items-center justify-center w-[26px] h-[26px]",
            today ? "bg-[var(--accent)] text-[var(--text-on-accent)] rounded-full font-bold" : (isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]")
          )}
        >
          {format(day, 'd')}
        </span>
      </button>
      <div className="flex items-center justify-center gap-[3px] h-[7px] w-full mb-1" aria-hidden="true">
        {pulseDots(count)}
      </div>
      <div className="flex flex-col gap-1 w-full flex-1">
        {items.slice(0, 4).map(item => (
          <WeekChip key={`${item.__type}-${item.id}`} item={item} onClick={onItemClick} />
        ))}
        {count > 4 && (
          <button
            type="button"
            onClick={() => onSelectDay(day)}
            className="font-mono text-[8.5px] text-[var(--text-tertiary)] text-center py-0.5 cursor-pointer hover:text-[var(--text-primary)] w-full"
          >
            <span className="text-[var(--text-secondary)] font-semibold">+{count - 4}</span> more
          </button>
        )}
        {count === 0 && (
          <div className="font-mono text-[8.5px] text-[var(--text-tertiary)] text-center py-2.5 opacity-70">
            clear
          </div>
        )}
      </div>
    </div>
  )
})

function WeekViewComponent({ tasks = [], events = [], currentDate, isLoading, onTaskClick, onEventClick, onSelectDay, selectedDay }) {
  const days = useMemo(() => {
    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
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

  const itemsByDate = useMemo(() => {
    const map = {}
    days.forEach(d => {
      const k = format(d, 'yyyy-MM-dd')
      const items = [
        ...(tasksByDate[k] || []).map(t => ({ ...t, __type: 'task' })),
        ...(eventsByDate[k] || []).map(e => ({ ...e, __type: 'event' }))
      ]
      items.sort((a, b) => new Date(a.__type === 'event' ? a.startTime : a.dueDate) - new Date(b.__type === 'event' ? b.startTime : b.dueDate))
      map[k] = items
    })
    return map
  }, [days, tasksByDate, eventsByDate])

  const dayCounts = useMemo(() => {
    const counts = {}
    days.forEach(d => { const k = format(d, 'yyyy-MM-dd'); counts[k] = itemsByDate[k]?.length || 0 })
    return counts
  }, [days, itemsByDate])

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[600px] gap-2 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="flex-1 min-h-[500px] w-full rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-1.5 h-full min-h-0">
      {days.map(day => {
        const k = format(day, 'yyyy-MM-dd')
        return (
          <PulseColumn
            key={k}
            day={day}
            items={itemsByDate[k] || []}
            count={dayCounts[k] || 0}
            isSelected={selectedDay ? format(selectedDay, 'yyyy-MM-dd') === k : false}
            onSelectDay={onSelectDay}
            onItemClick={(item) => item.__type === 'event' ? onEventClick?.(item) : onTaskClick?.(item)}
          />
        )
      })}
    </div>
  )
}

export const WeekView = React.memo(WeekViewComponent)


