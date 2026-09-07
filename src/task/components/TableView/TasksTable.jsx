import React from 'react'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { Badge } from '@/shared/ui/Badge'
import { Icons } from '@/shared/ui/Icons'
import { IconButton } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { InlineEditable } from '@/shared/ui/InlineEditable'
import { cn } from '@/shared/lib/cn'
import { normalizePriority, PRIORITY_COLORS } from '@/shared/lib/priority'

import { StatusBadge } from '@/shared/ui/StatusBadge'

function DueBadge({ dueDate }) {
  if (!dueDate) return <Icons.minus className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-label="No due date" />
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  const dateStr = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  if (diffDays < 0) return (
    <span className="text-[11px] font-semibold text-[var(--danger)] bg-[var(--danger-soft)] px-2 py-0.5 rounded-md">
      {dateStr}   Overdue
    </span>
  )
  if (diffDays === 0) return (
    <span className="text-[11px] font-semibold text-[var(--warning)] bg-[var(--warning-soft)] px-2 py-0.5 rounded-md">
      Today
    </span>
  )
  if (diffDays <= 2) return (
    <span className="text-[11px] font-semibold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-md">
      {dateStr}   Soon
    </span>
  )
  return <span className="text-[var(--text-secondary)] text-xs">{dateStr}</span>
}

export function TasksTable({
  tasks,
  isLoading,
  rowSelection,
  setRowSelection,
  getRowId,
  onTaskClick,
  onQuickComplete,
  onQuickDelete,
  emptyState
}) {
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const handleDelete = async (task) => {
    const ok = await confirm({
      title: `Delete "${task.title}"?`,
      description: 'This removes the task permanently. This can\'t be undone.',
      confirmLabel: 'Delete task',
      danger: true,
    })
    if (ok) onQuickDelete(task)
  }

  const columns = React.useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center pl-1">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() ? true : (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center pl-1" onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Task',
      cell: ({ row }) => {
        const task = row.original
        const isDone = task.status === 'Done' || task.status === 'COMPLETED'
        return (
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <StatusBadge status={task.status} showIcon={false} />
            </div>
            <div className="min-w-0">
              <InlineEditable
                value={task.title}
                onSave={(newTitle) => {
                  if (onTaskClick) onTaskClick({ ...task, title: newTitle })
                }}
                truncate
                className={cn(
                  'font-medium text-[13px]',
                  isDone && 'line-through text-[var(--text-muted)]'
                )}
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'projectId',
      header: 'Project',
      cell: ({ row }) => {
        const projectName = row.original.projectName
        const projectId = row.original.projectId
        if (!projectId) return <Icons.minus className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-label="No project" />
        return (
          <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
            {projectName || `#${projectId}`}
          </span>
        )
      }
    },
    {
      accessorKey: 'teamId',
      header: 'Team',
      cell: ({ row }) => {
        const teamName = row.original.teamName || row.original.team?.name
        const teamId = row.original.teamId || row.original.team?.id
        if (!teamId && !teamName) return <Icons.minus className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-label="No team" />
        return (
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
            {teamName || `#${teamId}`}
          </span>
        )
      }
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.original.priority
        return (
          <span className={cn(
            "text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md",
            PRIORITY_COLORS[p] || PRIORITY_COLORS.MEDIUM
          )}>
            {normalizePriority(p)}
          </span>
        )
      }
    },
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => <DueBadge dueDate={row.original.dueDate} />
    }
  ], [onTaskClick])

  return (
    <div aria-live="polite">
      {confirmDialog}
      <DataTable
        columns={columns}
        data={tasks || []}
        isLoading={isLoading}
        emptyStateNode={emptyState}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        getRowId={getRowId}
        onRowClick={onTaskClick}
      />
    </div>
  )
}
