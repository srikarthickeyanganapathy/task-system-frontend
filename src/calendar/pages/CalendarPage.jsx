import React, { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, parseISO } from 'date-fns'
import { useTaskList } from '@/task'
import { useCalendarEvents, useUpdateEvent, useDeleteEvent, CalendarView, EventForm } from '@/calendar'
import { useNavigate } from 'react-router-dom'
import { TaskForm } from '@/task'
import { Modal, ModalContent } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Heading, Text } from '@/shared/ui/Typography'
import { Badge } from '@/shared/ui/Badge'
import { Edit3 } from '@/shared/ui/Icons'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PageShell, PageContent } from '@/shared/ui/PageShell'
import { PageState } from '@/shared/ui/PageState'
import { useWorkspace } from '@/app/providers/WorkspaceProvider'

export function CalendarPage() {
  const navigate = useNavigate();
  const { workspaceMode, activeOrganization, activeCrew } = useWorkspace()
  const scope = useMemo(() => {
    if (workspaceMode === 'ORG') return { orgId: activeOrganization?.id || 'pending' }
    if (workspaceMode === 'CREWS') return { crewId: activeCrew?.id || 'pending' }
    return {}
  }, [workspaceMode, activeOrganization, activeCrew])

  const [visibleRange, setVisibleRange] = useState(() => {
    const now = new Date()
    return { start: startOfWeek(startOfMonth(now)), end: endOfWeek(endOfMonth(now)) }
  })

  const { data: { tasks = [] } = {}, isLoading: tasksLoading, isError: tasksError, refetch: refetchTasks } = useTaskList()
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useCalendarEvents(
    visibleRange.start.toISOString(), visibleRange.end.toISOString(), scope
  )

  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const { confirm, dialog } = useConfirmDialog()

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)

  const closeEventModal = () => {
    setSelectedEvent(null)
    setEditingEvent(null)
  }

  const handleDeleteEvent = async (event) => {
    const confirmed = await confirm({
      title: 'Delete Event?',
      description: 'This event will be permanently removed from your calendar.',
      danger: true,
      confirmLabel: 'Delete Event',
    })
    if (confirmed) {
      deleteEvent.mutate(event.id, { onSuccess: closeEventModal })
    }
  }

  const workspaceModeLabel = workspaceMode === 'ORG' ? 'ORG' : workspaceMode === 'CREWS' ? 'CREWS' : 'PERSONAL'
  const workspaceName = workspaceMode === 'ORG' ? activeOrganization?.name : workspaceMode === 'CREWS' ? activeCrew?.name : null
  const eyebrow = workspaceName ? `${workspaceName} Calendar` : 'Personal Calendar'

  const isLoading = tasksLoading || eventsLoading;
  const isError = tasksError || eventsError;
  const pageState = isError ? 'error' : isLoading ? 'loading' : 'ready';
  const handleRetry = () => { refetchTasks(); refetchEvents(); };

  return (
    <PageShell maxWidth="default" workspaceMode={workspaceModeLabel}>
      <PageContent className="pt-6">
        <PageState state={pageState} stateProps={{ onRetry: handleRetry, loadingVariant: 'calendar' }}>
        <div className="flex-1 min-h-0">
          <CalendarView
            tasks={tasks}
            events={events}
            isLoading={tasksLoading || eventsLoading}
            onVisibleRangeChange={setVisibleRange}
            onTaskClick={(task) => navigate(`/app/tasks/${task.id}`, { state: { task } })}
            onEventClick={setSelectedEvent}
            TaskFormComponent={TaskForm}
            scope={scope}
            eyebrow={eyebrow}
          />
        </div>

        <Modal open={!!selectedEvent || !!editingEvent} onOpenChange={(open) => !open && closeEventModal()}>
          <ModalContent className="sm:max-w-md !bg-[var(--bg-card)] !backdrop-blur-none border border-[var(--border-subtle)] shadow-xl rounded-2xl p-6">
            {editingEvent ? (
              <EventForm
                key={editingEvent.id}
                defaultValues={{
                  id: editingEvent.id,
                  title: editingEvent.title || '',
                  description: editingEvent.description || '',
                  location: editingEvent.location || '',
                  startTime: editingEvent.startTime ? format(new Date(editingEvent.startTime), "yyyy-MM-dd'T'HH:mm") : '',
                  endTime: editingEvent.endTime ? format(new Date(editingEvent.endTime), "yyyy-MM-dd'T'HH:mm") : '',
                  isAllDay: !!editingEvent.isAllDay,
                }}
                onSubmit={(payload) => updateEvent.mutate({ id: editingEvent.id, payload }, { onSuccess: () => setEditingEvent(null) })}
                onCancel={() => setEditingEvent(null)}
                onDelete={() => handleDeleteEvent(editingEvent)}
                isLoading={updateEvent.isPending}
                isDeleting={deleteEvent.isPending}
              />
            ) : selectedEvent ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Heading level={3} className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">{selectedEvent.title}</Heading>
                  {selectedEvent.type && <Badge variant="outline" className="text-[10px] uppercase bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]">{selectedEvent.type}</Badge>}
                </div>
                <div className="space-y-2 text-[12px] text-[var(--text-secondary)]">
                  <p><strong>Start:</strong> {selectedEvent.startTime ? format(new Date(selectedEvent.startTime), 'PPp') : format(new Date(selectedEvent.date), 'PP')}</p>
                  {selectedEvent.endTime && <p><strong>End:</strong> {format(new Date(selectedEvent.endTime), 'PPp')}</p>}
                  {selectedEvent.location && <p><strong>Location:</strong> {selectedEvent.location}</p>}
                </div>
                {selectedEvent.description && (
                  <div className="pt-4 border-t border-[var(--border-subtle)]">
                    <Text variant="secondary" className="whitespace-pre-wrap text-[13px]">{selectedEvent.description}</Text>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                  <Button variant="outline" size="sm" className="h-8 text-[12px] text-[var(--danger)] hover:bg-[var(--danger-soft)] focus-visible:ring-2 focus-visible:ring-[var(--danger)]" onClick={() => handleDeleteEvent(selectedEvent)}>
                    Delete
                  </Button>
                  <Button size="sm" className="h-8 text-[12px] gap-1.5 focus-visible:ring-2 focus-visible:ring-[var(--accent)]" onClick={() => { setEditingEvent(selectedEvent); setSelectedEvent(null) }}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                </div>
              </div>
            ) : null}
          </ModalContent>
        </Modal>
        {dialog}
        </PageState>
      </PageContent>
    </PageShell>
  )
}
