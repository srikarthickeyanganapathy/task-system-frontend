 import React from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icons } from '@/shared/ui/Icons'
import { Badge } from '@/shared/ui/Badge'
import { cn } from '@/shared/lib/cn'
import { normalizePriority, PRIORITY_COLORS } from '@/shared/lib/priority'
import { useAuth, usePermissions } from '@/identity'
import { useWorkspace } from '@/app/providers/WorkspaceProvider'

/* --- Priority accent bars --- */
const PRIORITY_ACCENTS = {
  URGENT:  { bar: 'bg-[var(--danger)]', glow: 'shadow-[0_0_16px_var(--danger-soft)]', border: 'border-[var(--danger)]/20 hover:border-[var(--danger)]/40' },
  HIGH:    { bar: 'bg-orange-400', glow: 'shadow-[0_0_12px_rgba(251,146,60,0.12)]', border: 'border-orange-400/20 hover:border-orange-400/35' },
  MEDIUM:  { bar: 'bg-[var(--accent)]', glow: 'shadow-[0_0_12px_var(--accent-border)]', border: 'border-[var(--accent-border)] hover:border-[var(--accent-border)]' },
  LOW:     { bar: 'bg-[var(--text-tertiary)]', glow: '', border: '' },
}
const DEFAULT_ACCENT = { bar: 'bg-[var(--border-subtle)]', glow: '', border: '' }

function getDueInfo(dueDate) {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Overdue', color: 'text-[var(--danger)] bg-[var(--danger-soft)]' }
  if (diffDays === 0) return { label: 'Today', color: 'text-[var(--warning)] bg-[var(--warning-soft)]' }
  if (diffDays <= 2) return { label: 'Soon', color: 'text-orange-400 bg-orange-400/10' }
  return null
}

export function KanbanTaskCard({ task, onClick, onQuickComplete, onQuickDelete, canAct = false }) {
  const { user } = useAuth()
  const { canEditTask, isSuperAdmin } = usePermissions()
  const { workspaceMode } = useWorkspace()

  const assigneeUsername = typeof task.assignee === 'object' ? task.assignee?.username : (task.assignee || task.assignedTo)
  const creatorUsername = typeof task.creator === 'object' ? task.creator?.username : task.creator
  const isAssignee = assigneeUsername === user?.username || assigneeUsername === user?.id || (typeof task.assignee === 'object' && task.assignee?.id === user?.id)
  const isCreator = creatorUsername === user?.username || (typeof task.creator === 'object' && task.creator?.id === user?.id) || task.createdBy === user?.id
  const isAuthorized = workspaceMode === 'PERSONAL' || isSuperAdmin || canEditTask || canAct || isAssignee || isCreator

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task }, disabled: !isAuthorized })

  const style = { transform: CSS.Transform.toString(transform), transition }

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="w-full min-h-[88px] rounded-lg border-2 border-dashed border-[var(--accent-border)] bg-[var(--accent-soft)]/30 opacity-50" />
    )
  }

  const accent = PRIORITY_ACCENTS[task.priority] || DEFAULT_ACCENT
  const isDone = task.status === 'Done' || task.status === 'COMPLETED' || task.status === 'APPROVED'
  const dueInfo = getDueInfo(task.dueDate)
  const initials = (typeof task.assignedTo === 'object'
    ? (task.assignedTo?.username || '?')
    : (task.assignedTo || task.assigneeUsername || '?')
  ).slice(0, 2).toUpperCase()

  const ringColor = isDone
    ? 'ring-emerald-400/50'
    : task.priority === 'URGENT'
      ? 'ring-red-400/50'
      : 'ring-[var(--accent-border)]'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      whileHover={isDragging ? undefined : { y: -2, scale: 1.01 }}
      whileTap={isDragging ? undefined : { scale: 0.985 }}
      {...attributes}
      {...listeners}
      onClick={() => onClick && onClick(task)}
      className={cn(
        'group relative rounded-lg p-3.5 mb-2.5',
        'bg-[var(--bg-card)]',
        'border border-[var(--border-subtle)]',
        'shadow-[var(--shadow-xs)]',
        'hover:shadow-[var(--shadow-md)] hover:border-[var(--accent-border)]/40',
        'transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]',
        isAuthorized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDone && 'opacity-70 saturate-50',
        accent.border,
        accent.glow,
      )}
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-full', accent.bar)} />

      <div className="pl-2.5 space-y-2.5">
        {/* Task ref + hover actions */}
        <div className="flex items-center justify-between gap-2">
          {task.id && (
            <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-tight">
              #{typeof task.id === 'string' ? task.id.slice(0, 8) : task.id}
            </span>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isDone && (
              <button
                onClick={(e) => { e.stopPropagation(); onQuickComplete?.(task) }}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                title="Quick complete"
              >
                <Icons.check className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onQuickDelete?.(task.id) }}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
              title="Delete task"
            >
              <Icons.trash className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className={cn(
          'text-[13px] font-semibold leading-snug line-clamp-2 text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]',
          isDone && 'line-through text-[var(--text-muted)] group-hover:text-[var(--text-muted)]'
        )}>
          {task.title}
        </h4>

        {/* Tags row */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className={cn(
            'px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider',
            PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
          )}>
            {normalizePriority(task.priority)}
          </span>
          {task.projectName && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded-md font-medium truncate max-w-[90px] border border-[var(--border-subtle)]">
              {task.projectName}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5">
            {task.dueDate ? (
              <span className={cn(
                'flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                dueInfo ? dueInfo.color : 'text-[var(--text-muted)] bg-[var(--bg-subtle)]'
              )}>
                <Icons.calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            ) : (
              <Icons.minus className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-label="No due date" />
            )}
          </div>

          {task.assignedTo && (
            <div
              className={cn(
                'w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[9px] font-bold ring-2 shrink-0',
                ringColor
              )}
              title={typeof task.assignedTo === 'object' ? task.assignedTo.username : task.assignedTo}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
