import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from '@/shared/ui/Typography'
import { Badge } from '@/shared/ui/Badge'
import { InteractiveCard } from '@/shared/ui/InteractiveCard'
import { calculateHealthScore, getHealthStatus, formatRelativeDate } from '../features/utils/projectUtils'
import { cn } from '@/shared/lib/cn'
import { ArrowRight } from "../../shared/ui/Icons";

export function ProjectCard({ project }) {
  const { id, name, description, progress = 0, tasksTotal = 0, tasksCompleted = 0, dueDate, status, teamName, organizationName } = project
  const tasksLeft = (tasksTotal || 0) - (tasksCompleted || 0)
  const navigate = useNavigate()
  
  const healthScore = calculateHealthScore(project)
  const health = getHealthStatus(healthScore)
  const formattedDueDate = formatRelativeDate(dueDate)
  const isOverdue = formattedDueDate.includes('Overdue')

  // SVG Progress Ring Math
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - ((progress || 0) / 100) * circumference

  const handleClick = useCallback((e) => {
    e.preventDefault()
    // Progressive disclosure: quick peek via drawer
    const event = new CustomEvent('open-project-drawer', {
      detail: {
        id, name, description, status, progress,
        taskCount: tasksTotal, completedCount: tasksCompleted,
        dueDate, teamName, organizationName
      }
    })
    window.dispatchEvent(event)
  }, [id, name, description, status, progress, tasksTotal, tasksCompleted, dueDate, teamName, organizationName])

  const handleOpenFull = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    navigate(`/app/projects/${id}`)
  }, [id, navigate])

  return (
    <div className="block h-full group">
      <InteractiveCard onClick={handleClick} className="h-full flex flex-col p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border",
              health.tone === 'success' && 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]',
              health.tone === 'accent' && 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]',
              health.tone === 'warning' && 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]',
              health.tone === 'danger' && 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)]'
            )}>
              {health.label} {healthScore}
            </span>
          </div>
          <Badge variant="outline" className={cn('text-[10px]', status === 'COMPLETED' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]')}>{status || 'ACTIVE'}</Badge>
        </div>

        <button onClick={handleClick} className="text-left w-full">
          <Heading level={4} className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors truncate">
            {name}
          </Heading>
        </button>

        <button onClick={handleClick} className="text-left w-full">
          <Text size="sm" variant="muted" className="text-[12px] leading-relaxed mb-4 line-clamp-2 min-h-[32px]">
            {description || 'No description provided.'}
          </Text>
        </button>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/50">
          <button onClick={handleClick} className="flex items-center gap-3 text-left">
            {/* Progress Ring */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 transform -rotate-90 absolute inset-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--bg-subtle)" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r={radius} 
                  fill="none" 
                  stroke="var(--accent)" 
                  strokeWidth="3" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">{progress || 0}%</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">
              <div>{tasksCompleted || 0}/{tasksTotal || 0} Tasks</div>
              <div className="text-[var(--text-tertiary)]">{tasksLeft > 0 ? `${tasksLeft} left` : 'All done'}</div>
            </div>
          </button>
          
          {dueDate ? (
            <button onClick={handleClick} className={cn(
              "text-[11px] font-medium px-2 py-1 rounded-md",
              isOverdue ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
            )}>
              {formattedDueDate}
            </button>
          ) : null}

          <button
            onClick={handleOpenFull}
            className="text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--bg-subtle)]"
            title="Open full project"
          >
            <ArrowRight />
          </button>
        </div>
      </InteractiveCard>
    </div>
  )
}
