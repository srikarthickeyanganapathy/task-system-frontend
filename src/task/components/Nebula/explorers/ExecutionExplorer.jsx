import React, { useMemo } from 'react'
import ExplorerNavBar from './ExplorerNavBar'
import { Target, ShieldCheck, ShieldAlert, CheckCircle, AlertCircle, ArrowRight, User, Calendar, Paperclip } from '@/shared/ui/Icons'
import { cn } from '@/shared/lib/cn'

function ReadinessBar({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Ready' : score >= 50 ? 'Partially Ready' : 'Not Ready'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Readiness</span>
        <span className="text-xs font-bold" style={{ color }}>{score}% ? {label}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function CheckItem({ label, passed, detail }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {passed ? (
        <CheckCircle size={14} className="text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle size={14} className="text-rose-400 shrink-0" />
      )}
      <div className="flex-1">
        <span className={cn("text-xs", passed ? "text-white/70" : "text-white/90 font-medium")}>{label}</span>
        {detail && <span className="text-[10px] text-white/30 ml-1.5">{detail}</span>}
      </div>
    </div>
  )
}

export default function ExecutionExplorer({ context, navigator, analysis, onCenterOnGraph, onOpenWorkbench }) {
  const { currentTask, currentTaskId } = navigator

  const blockers = useMemo(() => analysis.getBlockers(currentTaskId), [analysis, currentTaskId])

  const readiness = useMemo(() => {
    if (!currentTask) return { score: 0, checks: [] }

    const checks = []
    let totalWeight = 0
    let passedWeight = 0

    // Blockers resolved?
    const unresolvedBlockers = blockers.filter(t => {
      const s = (t.status || t.currentStatus || '').toUpperCase()
      return s !== 'COMPLETED' && s !== 'DONE'
    })
    const blockersResolved = unresolvedBlockers.length === 0
    checks.push({ label: 'All blockers resolved', passed: blockersResolved, detail: blockersResolved ? null : `${unresolvedBlockers.length} remaining`, weight: 30 })
    totalWeight += 30
    if (blockersResolved) passedWeight += 30

    // Assignee set?
    const hasAssignee = !!(currentTask.assignedTo || currentTask.assignee)
    checks.push({ label: 'Assignee assigned', passed: hasAssignee, detail: hasAssignee ? currentTask.assignedTo || currentTask.assignee : null, weight: 20 })
    totalWeight += 20
    if (hasAssignee) passedWeight += 20

    // Due date set?
    const hasDueDate = !!currentTask.dueDate
    checks.push({ label: 'Due date set', passed: hasDueDate, detail: hasDueDate ? new Date(currentTask.dueDate).toLocaleDateString() : null, weight: 15 })
    totalWeight += 15
    if (hasDueDate) passedWeight += 15

    // Priority set?
    const hasPriority = !!(currentTask.priority)
    checks.push({ label: 'Priority defined', passed: hasPriority, detail: hasPriority ? currentTask.priority : null, weight: 10 })
    totalWeight += 10
    if (hasPriority) passedWeight += 10

    // Description exists?
    const hasDescription = !!(currentTask.description && currentTask.description.trim().length > 10)
    checks.push({ label: 'Description provided', passed: hasDescription, weight: 10 })
    totalWeight += 10
    if (hasDescription) passedWeight += 10

    // Checklist progress
    const checklists = currentTask.checklists || []
    if (checklists.length > 0) {
      const completed = checklists.filter(c => c.completed).length
      const checklistDone = completed === checklists.length
      checks.push({ label: 'Checklist complete', passed: checklistDone, detail: `${completed}/${checklists.length}`, weight: 15 })
      totalWeight += 15
      if (checklistDone) passedWeight += 15
    }

    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0
    return { score, checks }
  }, [currentTask, blockers])

  if (!currentTask) {
    return <div className="p-4 text-white/30 text-sm italic">No task selected</div>
  }

  return (
    <div className="space-y-4">
      <ExplorerNavBar navigator={navigator} onCenterOnGraph={onCenterOnGraph} />

      {/* Readiness Score */}
      <ReadinessBar score={readiness.score} />

      {/* Execution Checks */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Target size={12} className="text-cyan-400" />
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Execution Checks
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-0.5">
          {readiness.checks.map((check, idx) => (
            <CheckItem key={idx} {...check} />
          ))}
        </div>
      </div>

      {/* Unresolved Blockers */}
      {blockers.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldAlert size={12} className="text-rose-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Blockers ({blockers.length})
            </span>
          </div>
          <div className="space-y-0.5">
            {blockers.map(task => {
              const s = (task.status || task.currentStatus || '').toUpperCase()
              const resolved = s === 'COMPLETED' || s === 'DONE'
              return (
                <button
                  key={task.id}
                  onClick={() => navigator.navigateTo(task.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  {resolved ? <ShieldCheck size={12} className="text-emerald-400" /> : <ShieldAlert size={12} className="text-rose-400" />}
                  <span className={cn("text-xs truncate flex-1", resolved ? "text-white/40 line-through" : "text-white/80")}>
                    {task.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Open in Workbench */}
      {onOpenWorkbench && (
        <button
          onClick={() => onOpenWorkbench(currentTask)}
          className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5">Edit in Workbench <ArrowRight size={14} aria-hidden="true" /></span>
        </button>
      )}
    </div>
  )
}
