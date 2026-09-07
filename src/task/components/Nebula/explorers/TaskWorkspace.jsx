import React, { useMemo } from 'react'
import ExplorerNavBar from './ExplorerNavBar'
import { Heading, Text } from '@/shared/ui/Typography'
import { Badge } from '@/shared/ui/Badge'
import { ArrowDown, ArrowUp, ArrowRight, Calendar, Flag, User, CheckCircle, Paperclip, MessageSquare, Zap, Route, Target } from '@/shared/ui/Icons'
import { cn } from '@/shared/lib/cn'

const PRIORITY_STYLE = {
  URGENT: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  HIGH: 'text-amber-400 bg-[var(--warning-soft)] border-amber-500/30',
  MEDIUM: 'text-blue-400 bg-[var(--accent-soft)] border-blue-500/30',
  LOW: 'text-emerald-400 bg-[var(--success-soft)] border-emerald-500/30'
}

function Stat({ icon: Icon, label, value, color, onClick }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 transition-colors",
        onClick && "hover:bg-white/10 cursor-pointer"
      )}
    >
      <Icon size={14} className={color || "text-white/40"} />
      <div className="flex-1 text-left">
        <div className="text-[10px] text-white/35 uppercase tracking-wider">{label}</div>
        <div className="text-xs text-white/90 font-medium">{value}</div>
      </div>
    </Comp>
  )
}

export default function TaskWorkspace({ context, navigator, analysis, onCenterOnGraph, onOpenWorkbench, onOpenAnalysis }) {
  const { currentTask, currentTaskId } = navigator

  const blockers = useMemo(() => analysis.getBlockers(currentTaskId), [analysis, currentTaskId])
  const unblocks = useMemo(() => analysis.getUnblocks(currentTaskId), [analysis, currentTaskId])
  const cascade = useMemo(() => analysis.getDownstreamCascade(currentTaskId), [analysis, currentTaskId])

  if (!currentTask) {
    return <div className="p-4 text-white/30 text-sm italic">No task selected</div>
  }

  const status = currentTask.status || currentTask.currentStatus || 'OPEN'
  const priority = (currentTask.priority || 'MEDIUM').toUpperCase()
  const priorityStyle = PRIORITY_STYLE[priority] || PRIORITY_STYLE.MEDIUM

  const checklistTotal = currentTask.checklists?.length || 0
  const checklistDone = currentTask.checklists?.filter(c => c.completed).length || 0
  const evidenceCount = currentTask.evidence?.length || 0

  return (
    <div className="space-y-4">
      <ExplorerNavBar navigator={navigator} onCenterOnGraph={onCenterOnGraph} />

      {/* Identity */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80">Task #{currentTask.id}</span>
        <Heading level={3} className="text-base font-bold text-white mt-1 leading-snug">
          {currentTask.title}
        </Heading>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px] uppercase font-mono text-white/70 border-white/20">
            {status}
          </Badge>
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border", priorityStyle)}>
            {priority}
          </span>
        </div>
      </div>

      {/* Description */}
      {currentTask.description && (
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap line-clamp-4">
            {currentTask.description}
          </p>
        </div>
      )}

      {/* Context Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat icon={User} label="Assignee" value={currentTask.assignedTo || currentTask.assignee || 'Unassigned'} color="text-purple-400" />
        <Stat icon={Calendar} label="Due Date" value={currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'No deadline'} color="text-cyan-400" />
        <Stat
          icon={ArrowUp}
          label="Blocked By"
          value={`${blockers.length} task${blockers.length !== 1 ? 's' : ''}`}
          color="text-rose-400"
          onClick={blockers.length > 0 ? () => onOpenAnalysis?.('dependency') : undefined}
        />
        <Stat
          icon={Zap}
          label="Cascade Impact"
          value={`${cascade.length} downstream`}
          color="text-emerald-400"
          onClick={cascade.length > 0 ? () => onOpenAnalysis?.('impact') : undefined}
        />
      </div>

      {/* Quick Metrics */}
      <div className="flex items-center gap-3 text-[11px] text-white/40">
        {checklistTotal > 0 && (
          <span className="flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-400/50" />
            {checklistDone}/{checklistTotal} checklist
          </span>
        )}
        {evidenceCount > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip size={12} className="text-purple-400/50" />
            {evidenceCount} evidence
          </span>
        )}
        {currentTask.commentsCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={12} className="text-blue-400/50" />
            {currentTask.commentsCount} comments
          </span>
        )}
      </div>

      {/* Tags */}
      {currentTask.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentTask.tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Open in Workbench */}
      {onOpenWorkbench && (
        <button
          onClick={() => onOpenWorkbench(currentTask)}
          className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5">Edit in Workbench <ArrowRight size={14} aria-hidden="true" /></span>
        </button>
      )}
    </div>
  )
}
