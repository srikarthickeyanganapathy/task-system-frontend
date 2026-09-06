import React, { useState } from 'react'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { CalendarRail } from './CalendarRail'
import { AgendaList } from './AgendaList'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from '@/shared/ui/Icons'
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'
import { Button } from '@/shared/ui/Button'
import { PillNav } from '@/shared/ui/PillNav'
import { Modal, ModalContent } from '@/shared/ui/Modal'
import { EventForm } from './EventForm'
import { useCreateTask } from '@/task'
import { useCreateEvent } from '../hooks/useCalendar'
import { cn } from '@/shared/lib/cn'

function CalendarViewComponent({ tasks, events = [], isLoading, onTaskClick, onEventClick, onVisibleRangeChange, TaskFormComponent, scope = {}, eyebrow }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'month'

  const [currentDate, setCurrentDate] = useState(startOfToday())
  const [selectedDay, setSelectedDay] = useState(startOfToday())
  const [quickAddDate, setQuickAddDate] = useState(null)
  const [createType, setCreateType] = useState('event')
  const [filterType, setFilterType] = useState('all')

  const createTaskMutation = useCreateTask()
  const createEventMutation = useCreateEvent(scope)

  const filteredTasks = filterType === 'events' ? [] : (tasks || [])
  const filteredEvents = filterType === 'tasks' ? [] : (events || [])

  const rangeCounts = React.useMemo(() => {
    const start = mode === 'month' ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate)
    const end = mode === 'month' ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate)
    const inRange = (iso) => iso ? isWithinInterval(parseISO(iso), { start, end }) : false
    return {
      events: (events || []).filter(e => inRange(e.startTime)).length,
      tasks: (tasks || []).filter(t => inRange(t.dueDate)).length
    }
  }, [mode, currentDate, tasks, events])

  const handleCreate = (payload) => {
    if (createType === 'task') {
      const taskPayload = { ...payload, dueDate: payload.dueDate ? new Date(payload.dueDate).toISOString() : null }
      createTaskMutation.mutate(taskPayload, { onSuccess: () => setQuickAddDate(null) })
    } else {
      const eventPayload = {
        ...payload,
        startTime: payload.startTime ? new Date(payload.startTime).toISOString() : null,
        endTime: payload.endTime ? new Date(payload.endTime).toISOString() : null
      }
      createEventMutation.mutate(eventPayload, { onSuccess: () => setQuickAddDate(null) })
    }
  }

  React.useEffect(() => {
    if (!onVisibleRangeChange) return
    const start = mode === 'month' ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate)
    const end = mode === 'month' ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate)
    onVisibleRangeChange({ start, end })
  }, [currentDate, mode, onVisibleRangeChange])

  const setMode = (newMode) => {
    setSearchParams(params => { params.set('mode', newMode); return params }, { replace: true })
  }

  const next = () => mode === 'month' ? setCurrentDate(addMonths(currentDate, 1)) : setCurrentDate(addWeeks(currentDate, 1))
  const prev = () => mode === 'month' ? setCurrentDate(subMonths(currentDate, 1)) : setCurrentDate(subWeeks(currentDate, 1))
  const today = () => { setCurrentDate(startOfToday()); setSelectedDay(startOfToday()) }

  return (
    <div className="flex flex-col h-full min-h-0 pb-12">
      {/* Topbar equivalent (header inside view) -- PageHero contract */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-5 border-b border-[var(--border-subtle)] mb-5">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {eyebrow} · {mode === 'month' ? 'Month' : `Week of ${format(startOfWeek(currentDate), 'EEE d')}`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none flex items-baseline">
            {format(currentDate, 'MMMM')} <span className="text-[13px] font-semibold text-[var(--text-tertiary)] tracking-[0.06em] ml-2">{format(currentDate, 'yyyy')}</span>
          </h2>
          <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{rangeCounts.events}</span> events · <span className="font-semibold text-[var(--text-primary)]">{rangeCounts.tasks}</span> tasks this period
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 mr-2">
            <Button variant="outline" size="icon" aria-label={mode === 'month' ? 'Previous month' : 'Previous week'} className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" className="h-8 px-3.5 rounded-lg text-[12px] font-semibold text-[var(--accent)] border-[var(--accent-border)] bg-[var(--accent-soft)] hover:bg-[var(--accent-border)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" onClick={today}>Today</Button>
            <Button variant="outline" size="icon" aria-label={mode === 'month' ? 'Next month' : 'Next week'} className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div data-tour="calendar-view-toggle">
          <PillNav
            options={[{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }]}
            value={mode}
            onChange={setMode}
          />
          </div>
          <PillNav
            options={[{ value: 'all', label: 'All' }, { value: 'events', label: 'Events' }, { value: 'tasks', label: 'Tasks' }]}
            value={filterType}
            onChange={setFilterType}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 items-start">
        {/* Main section: map + agenda */}
        <div className="flex-1 min-w-0 flex flex-col w-full" data-tour="calendar-grid">
          <div className="shrink-0 overflow-x-auto custom-scrollbar">
            {mode === 'month' ? (
              <MonthView tasks={filteredTasks} events={filteredEvents} currentDate={currentDate} isLoading={isLoading} onTaskClick={onTaskClick} onEventClick={onEventClick} onSelectDay={setSelectedDay} selectedDay={selectedDay} />
            ) : (
              <WeekView tasks={filteredTasks} events={filteredEvents} currentDate={currentDate} isLoading={isLoading} onTaskClick={onTaskClick} onEventClick={onEventClick} onSelectDay={setSelectedDay} selectedDay={selectedDay} />
            )}
          </div>
          
          <div data-tour="calendar-create-area">
          <AgendaList 
            tasks={filteredTasks} 
            events={filteredEvents} 
            selectedDay={selectedDay} 
            onTaskClick={onTaskClick} 
            onEventClick={onEventClick} 
            onAddClick={(d) => setQuickAddDate(d)} 
          />
          </div>
        </div>

        {/* Right rail */}
        <div className="w-full lg:w-[290px] shrink-0 sticky top-4 flex flex-col gap-3.5">
          <CalendarRail tasks={filteredTasks} events={filteredEvents} onTaskClick={onTaskClick} onEventClick={onEventClick} />
        </div>
      </div>

      <Modal open={!!quickAddDate} onOpenChange={(open) => !open && setQuickAddDate(null)}>
        <ModalContent className="sm:max-w-md !bg-[var(--bg-card)] !backdrop-blur-none border border-[var(--border-subtle)] shadow-xl rounded-2xl p-6">
          <div className="flex items-center gap-1 mb-5 bg-[var(--bg-subtle)] rounded-lg p-0.5 w-fit border border-[var(--border-subtle)]">
            <Button variant="ghost" onClick={() => setCreateType('event')} className={cn('px-3 py-1 text-[11px] font-medium rounded-md transition-colors h-auto', createType === 'event' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)] font-semibold' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]')}>Event</Button>
            <Button variant="ghost" onClick={() => setCreateType('task')} className={cn('px-3 py-1 text-[11px] font-medium rounded-md transition-colors h-auto', createType === 'task' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)] font-semibold' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]')}>Task</Button>
          </div>

          {createType === 'task' ? (
            TaskFormComponent ? (
              <TaskFormComponent onSubmit={handleCreate} isLoading={createTaskMutation.isPending} defaultValues={{ title: '', description: '', assigneeUsername: '', priority: 'MEDIUM', dueDate: quickAddDate ? format(quickAddDate, `yyyy-MM-dd'T'${format(new Date(), 'HH:mm')}`) : '', tags: '', teamId: '' }} />
            ) : null
          ) : (
            <EventForm onSubmit={handleCreate} onCancel={() => setQuickAddDate(null)} isLoading={createEventMutation.isPending} defaultValues={{ title: '', description: '', location: '', startTime: quickAddDate ? format(quickAddDate, "yyyy-MM-dd'T'HH:mm") : '', endTime: quickAddDate ? format(quickAddDate, "yyyy-MM-dd'T'HH:mm") : '', isAllDay: false }} />
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export const CalendarView = React.memo(CalendarViewComponent)

