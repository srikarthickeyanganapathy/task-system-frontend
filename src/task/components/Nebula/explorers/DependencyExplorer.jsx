/**
 * NOTE: Per full-stack audit, TaskDependencyController and task dependency backend contracts
 * are unverified / unopened. This explorer component is currently kept as a general visualization
 * in src/features/task/components/explorers/ rather than pre-committed to a dedicated dependency slice.
 */
import React, { useMemo } from 'react'
import ExplorerNavBar from './ExplorerNavBar'
import { AlertTriangle, ArrowDown, ArrowUp, Route, ShieldAlert } from '@/shared/ui/Icons'
import { cn } from '@/shared/lib/cn'
import { resolveStatus } from '@/shared/lib/statusRegistry'
function TaskRow({ task, onClick, depth = 0, isActive }) {
  const status = task.status || task.currentStatus || 'OPEN'
  const statusColor = resolveStatus(status).colorClass || resolveStatus('TODO').colorClass

  return (
    <button
      onClick={() => onClick?.(task.id)}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer group",
        isActive ? "bg-cyan-500/15 border border-cyan-500/30" : "hover:bg-white/5 border border-transparent"
      )}
      style={{ paddingLeft: `${10 + depth * 16}px` }}
    >
      <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0", statusColor)}>
        {status}
      </span>
      <span className="text-xs text-white/90 truncate flex-1 group-hover:text-white">
        {task.title}
      </span>
      <span className="text-[10px] text-white/25 font-mono shrink-0">#{task.id}</span>
    </button>
  )
}

export default function DependencyExplorer({ context, navigator, analysis, onCenterOnGraph }) {
  const { currentTask, currentTaskId } = navigator

  const blockers = useMemo(() => analysis.getBlockers(currentTaskId), [analysis, currentTaskId])
  const unblocks = useMemo(() => analysis.getUnblocks(currentTaskId), [analysis, currentTaskId])
  const criticalPath = useMemo(() => analysis.getCriticalPath(currentTaskId), [analysis, currentTaskId])

  const unresolvedBlockers = blockers.filter(t => {
    const s = (t.status || t.currentStatus || '').toUpperCase()
    return s !== 'COMPLETED' && s !== 'DONE'
  })

  const chainDepth = criticalPath.length

  if (!currentTask) {
    return <div className="p-4 text-white/30 text-sm italic">No task selected</div>
  }

  return (
    <div className="space-y-4">
      <ExplorerNavBar navigator={navigator} onCenterOnGraph={onCenterOnGraph} />

      {/* Risk Assessment */}
      {unresolvedBlockers.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25">
          <ShieldAlert size={14} className="text-rose-400 shrink-0" />
          <span className="text-xs text-rose-300">
            {unresolvedBlockers.length} unresolved blocker{unresolvedBlockers.length > 1 ? 's' : ''}   Chain depth: {chainDepth}
          </span>
        </div>
      )}

      {/* Blocker Chain (Upstream) */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ArrowUp size={12} className="text-rose-400" />
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Blocked By ({blockers.length})
          </span>
        </div>
        {blockers.length === 0 ? (
          <p className="text-xs text-white/25 italic pl-5">No blockers ? this task is free to execute</p>
        ) : (
          <div className="space-y-0.5">
            {blockers.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={(id) => navigator.navigateTo(id)}
                isActive={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unlock Chain (Downstream) */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ArrowDown size={12} className="text-emerald-400" />
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Unblocks ({unblocks.length})
          </span>
        </div>
        {unblocks.length === 0 ? (
          <p className="text-xs text-white/25 italic pl-5">No downstream tasks depend on this</p>
        ) : (
          <div className="space-y-0.5">
            {unblocks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={(id) => navigator.navigateTo(id)}
                isActive={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Critical Path */}
      {criticalPath.length > 1 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Route size={12} className="text-amber-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Critical Path ({criticalPath.length} tasks)
            </span>
          </div>
          <div className="space-y-0.5">
            {criticalPath.map((task, idx) => (
              <TaskRow
                key={task.id}
                task={task}
                depth={idx}
                onClick={(id) => navigator.navigateTo(id)}
                isActive={task.id === currentTaskId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
