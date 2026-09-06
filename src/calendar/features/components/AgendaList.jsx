import React, { useMemo } from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import { Button } from '@/shared/ui/Button'
import { Plus, MapPin, Sparkles } from '@/shared/ui/Icons'
import { cn } from '@/shared/lib/cn'

const AgendaItem = React.memo(function AgendaItem({ item, onClick }) {
  const isEvent = item.__type === 'event'
  const date = parseISO(isEvent ? item.startTime : item.dueDate)
  
  const timeLabel = isEvent
    ? item.isAllDay ? 'All day' : `${format(date, 'h:mm a')}${item.endTime ? ' - ' + format(parseISO(item.endTime), 'h:mm a') : ''}`
    : format(date, 'h:mm a')

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        "group relative flex items-start gap-3.5 px-5 py-3.5 border-b border-[var(--border-subtle)] transition-colors cursor-pointer text-left w-full hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:z-10",
        "last:border-b-0"
      )}
    >
      <span 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[2.5px] opacity-0 group-hover:opacity-100 transition-opacity",
          isEvent ? "bg-[var(--accent)]" : "border-l-[2.5px] border-dashed border-[var(--warning)]"
        )}
      />
      <div className="w-[52px] shrink-0 pt-0.5">
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] tabular-nums">
          {timeLabel}
        </div>
        {!isEvent && (
          <span className="inline-block font-mono text-[8.5px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-[5px] px-1.5 py-0.5 mt-1.5">
            Task
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold tracking-tight text-[var(--text-primary)] leading-[1.4] truncate">
          {item.title}
        </div>
        {item.description && (
          <div className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-[1.5] line-clamp-2">
            {item.description}
          </div>
        )}
        {isEvent && item.location && (
          <div className="font-mono text-[9.5px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {item.location}
          </div>
        )}
      </div>

      <div className="shrink-0 self-center">
        <span 
          className={cn(
            "text-[9.5px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full whitespace-nowrap",
            isEvent 
              ? "text-[var(--accent)] bg-[var(--accent-soft)]" 
              : "text-[var(--warning)] bg-[var(--warning-soft)]"
          )}
        >
          {isEvent ? 'Event' : 'Task'}
        </span>
      </div>
    </button>
  )
})

function AgendaListComponent({ tasks = [], events = [], selectedDay, onTaskClick, onEventClick, onAddClick }) {
  const brief = useMemo(() => {
    if (!selectedDay) return []
    const pendingTasks = tasks.filter(t => t.dueDate && t.status !== 'Done').map(t => ({ ...t, __type: 'task' }))
    const validEvents = events.filter(e => e.startTime).map(e => ({ ...e, __type: 'event' }))
    
    return [...pendingTasks, ...validEvents]
      .filter(item => isSameDay(parseISO(item.__type === 'task' ? item.dueDate : item.startTime), selectedDay))
      .sort((a, b) => new Date(a.__type === 'task' ? a.dueDate : a.startTime) - new Date(b.__type === 'task' ? b.dueDate : b.startTime))
  }, [tasks, events, selectedDay])

  if (!selectedDay) return null

  return (
    <section className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm mt-3.5 overflow-hidden flex flex-col shrink-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="text-[15px] font-bold tracking-tight text-[var(--text-primary)] flex items-baseline gap-2">
          {format(selectedDay, 'eeee, MMMM d')}
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] font-medium">
            {format(selectedDay, 'yyyy-MM-dd')} · {brief.length} item{brief.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button 
          onClick={() => onAddClick(selectedDay)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent-border)] hover:bg-[var(--accent-border)] transition-colors h-auto focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
        {brief.length === 0 ? (
          <div className="py-12 px-5 text-center">
            <div className="w-11 h-11 mx-auto mb-3.5 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-[13.5px] font-semibold text-[var(--text-primary)]">
              The day is clear
            </div>
            <div className="text-[11.5px] text-[var(--text-tertiary)] mt-1 font-mono">
              No items scheduled · {format(selectedDay, 'yyyy-MM-dd')}
            </div>
          </div>
        ) : (
          brief.map(item => (
            <AgendaItem 
              key={`${item.__type}-${item.id}`} 
              item={item} 
              onClick={(it) => it.__type === 'event' ? onEventClick?.(it) : onTaskClick?.(it)} 
            />
          ))
        )}
      </div>
    </section>
  )
}

export const AgendaList = React.memo(AgendaListComponent)

