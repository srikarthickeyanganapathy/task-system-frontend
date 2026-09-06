import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Radio, Shield, AlertTriangle } from '@/shared/ui/Icons'
import { Heading, Text } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { Icons } from '@/shared/ui/Icons'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/Tooltip'
import { SaveToggle } from '@/saved/features/components/SaveToggle'
import { ENTITY_TYPES } from '@/shared/constants/entityTypes'
import { FolderIcon, ChecklistIcon, CheckIcon, ChatIcon } from './CrewShared'
import { PresenceHalo } from './PresenceHalo'
import { CrewStatusPill } from './CrewStatusPill'
import { cn } from '@/shared/lib/cn'

import { hashHue } from '@/shared/lib/avatar';

export function CrewHeader({
  crew,
  members = [],
  sharedProjects = [],
  crewTasks = [],
  channels = [],
  completionRate = 0,
  isCreator = false,
  onLeave,
  onOpenChat,
  onOpenTasks,
  onNewBoard,
  isConnected = true,
  socketStatus,
  isLoading = false,
  error = null,
}) {
  const navigate = useNavigate()

  // 1. Loading State (Tier 1 UX)
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)] animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-[var(--bg-subtle)] shrink-0" />
            <div className="space-y-3 min-w-0 flex-1">
              <div className="h-6 w-48 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)]" />
              <div className="h-4 w-72 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)]" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-[var(--bg-subtle)] rounded-full" />
                <div className="h-6 w-24 bg-[var(--bg-subtle)] rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-[var(--bg-subtle)] rounded-md" />
            <div className="h-9 w-24 bg-[var(--bg-subtle)] rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  // 2. Empty / Uninitialized State Guard
  if (!crew) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow-xs)]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
          <Heading level={3} className="text-[16px] font-semibold text-[var(--text-primary)]">
            Crew Not Found or Unavailable
          </Heading>
          <Text variant="muted" className="text-[13px] max-w-md">
            The requested crew workspace could not be loaded or may have been deleted.
          </Text>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/crews')} className="mt-2 gap-2">
            <Icons.chevronLeft className="w-4 h-4" /> Back to Crews
          </Button>
        </div>
      </div>
    )
  }

  // Calculate ambient HSL brand hue
  const hue = crew?.hue !== undefined ? crew.hue : hashHue(crew.name || '?')

  // Resolve socket connection status
  const resolvedSocketStatus = socketStatus || (isConnected ? 'connected' : 'disconnected')

  return (
    <div className="bg-[var(--bg-base)] border-b border-[var(--border-subtle)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Primary Identity Row */}
        <div className="flex items-center gap-3 py-3.5">
          {/* Back Navigation */}
          <button
            onClick={() => navigate('/app/crews')}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            title="Back to Crews"
            aria-label="Back to crews"
          >
            <Icons.chevronLeft className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div
            className="relative w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold shrink-0 border border-white/10"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${(hue + 35) % 360} 68% 38%))`,
            }}
          >
            {crew.name.charAt(0).toUpperCase()}
            {/* Live Socket Status Dot Overlay */}
            <span
              className={cn(
                'absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--bg-base)] shadow-xs',
                resolvedSocketStatus === 'connected' && 'bg-[var(--success)]',
                resolvedSocketStatus === 'reconnecting' && 'bg-[var(--warning)]',
                resolvedSocketStatus === 'disconnected' && 'bg-[var(--text-tertiary)]'
              )}
              title={`Websocket: ${resolvedSocketStatus}`}
            >
              {resolvedSocketStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" aria-hidden="true" />
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Name & Status Badges */}
            <Heading level={3} className="font-semibold truncate mb-0 text-[15px]">
              {crew.name}
            </Heading>

            {/* Crew Type Badge */}
            <Badge variant="primary" size="xs" className="font-mono uppercase text-[9px] tracking-wider shrink-0">
              Crew Workspace
            </Badge>

            {/* Visibility Badge */}
            {crew.visibility && (
              <Badge variant="outline" size="xs" className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] font-mono uppercase text-[9px] tracking-wider shrink-0">
                {crew.visibility.replace('_', ' ')}
              </Badge>
            )}

            {/* Owner / Creator Badge */}
            {isCreator && (
              <Badge variant="warning" size="xs" className="font-mono uppercase text-[9px] tracking-wider gap-1 shrink-0">
                <Shield className="w-2.5 h-2.5" /> Owner
              </Badge>
            )}

            {/* Crew Health Indicator Pill */}
            <CrewStatusPill completionRate={completionRate} crewTasks={crewTasks} members={members} size="sm" />

            {/* WebSocket Pulse Indicator */}
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <div className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)] cursor-default">
                    <span className="relative flex h-2 w-2">
                      {resolvedSocketStatus === 'connected' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" aria-hidden="true" />
                      )}
                      <span
                        className={cn(
                          'relative inline-flex rounded-full h-2 w-2',
                          resolvedSocketStatus === 'connected' && 'bg-[var(--success)]',
                          resolvedSocketStatus === 'reconnecting' && 'bg-[var(--warning)]',
                          resolvedSocketStatus === 'disconnected' && 'bg-[var(--text-tertiary)]'
                        )}
                      />
                    </span>
                    <span className="capitalize">{resolvedSocketStatus === 'connected' ? 'Live Pulse' : resolvedSocketStatus}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px]">
                  WebSocket Real-time Synchronization: <strong className="capitalize">{resolvedSocketStatus}</strong>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Save / Favorite Toggle */}
            <SaveToggle entityType={ENTITY_TYPES?.CREW || 'crew'} entityId={crew.id} className="ml-1" />

          </div>

          {/* Right Column: Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary Action: Add Task */}
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenTasks}
              className="gap-1 text-[11px] h-7 font-medium shadow-[var(--shadow-sm)] transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              title="Create or assign a new crew task"
            >
              <Icons.plus className="w-3 h-3" />
              <span>Add Task</span>
            </Button>

            {/* Secondary Action: New Whiteboard */}
            <Button
              variant="outline"
              size="sm"
              onClick={onNewBoard}
              className="gap-1 text-[11px] h-7 font-medium border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all duration-200 active:scale-95"
              title="Open a new collaborative whiteboard"
            >
              <Pencil className="w-3 h-3" />
              <span>New Board</span>
            </Button>

            {/* Discussion Action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenChat}
              className="gap-1 text-[11px] h-7 font-medium hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 active:scale-95"
              title="Open crew discussions channel"
            >
              <ChatIcon className="w-3 h-3" />
              <span>Discussion</span>
              {channels?.length > 0 && (
                <span className="ml-0.5 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--accent)] font-semibold">
                  {channels.length}
                </span>
              )}
            </Button>

            {/* Leave Crew Danger Soft Action */}
            {onLeave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLeave}
                className="gap-1 text-[11px] h-7 font-medium text-[var(--danger)] bg-transparent hover:bg-[var(--danger-soft)] border-[var(--danger-soft)] hover:border-[var(--danger)]/40 transition-all duration-200 active:scale-95"
                title="Leave this crew"
              >
                <LogOut className="w-3 h-3" />
                <span>Leave</span>
              </Button>
            )}
          </div>
        </div>

        {/* Secondary Meta Row: description + telemetry */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3.5">
          {crew.description && (
            <Text variant="muted" size="sm" className="text-[13px] max-w-xl line-clamp-2 leading-relaxed min-w-0">
              {crew.description}
            </Text>
          )}

          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {/* Member Presence Halos Stack */}
            <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-subtle)]">
              <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Crew:</span>
              <PresenceHalo members={members} maxDisplay={4} size="xs" />
            </div>

            {/* Metric Badges */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-medium">
              <FolderIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{sharedProjects?.length || 0} Projects</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-medium">
              <ChecklistIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{crewTasks?.length || 0} Tasks</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-medium">
              <ChatIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{channels?.length || 0} Channels</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-medium">
              <CheckIcon className="w-3.5 h-3.5 text-[var(--success)]" />
              <span className="font-mono">{completionRate || 0}% Done</span>
            </span>
          </div>
        </div>
      </div>
    </div>

  )
}
