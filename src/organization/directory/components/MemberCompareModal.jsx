import React from 'react';
import { motion } from 'framer-motion';
import { Modal, ModalContent } from '@/shared/ui/Modal';
import { Heading, Text } from '@/shared/ui/Typography';
import { IconButton } from '@/shared/ui/Button';
import { X, GitCompare, Users } from '@/shared/ui/Icons';
import { cn } from '@/shared/lib/cn';
import { avatarColor, GLASS_PANEL } from './directoryUtils';

// --- Member compare modal ---
// Overlay content -> glass chrome. Internal stat columns stay flat/plain text.

export function MemberCompareModal({ open, onOpenChange, compareMembers }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {compareMembers && (
        <ModalContent className={cn('max-w-2xl p-0 gap-0 overflow-hidden rounded-lg', GLASS_PANEL)}>
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <GitCompare className="w-5 h-5 text-[var(--text-muted)]" />
              <Heading level={2} className="text-base font-medium text-[var(--text-primary)]">
                Compare members
              </Heading>
            </div>
            <IconButton variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8" aria-label="Close comparison">
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[compareMembers.memberA, compareMembers.memberB].map((m) => (
                <div key={m.userId} className="space-y-3 p-4 rounded-lg border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white text-sm shrink-0 relative" style={{ backgroundColor: avatarColor(m.username || '?') }}>
                      {m.username?.charAt(0).toUpperCase() || '?'}
                      {m.isActiveNow && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] border-2 border-[var(--bg-card)] rounded-full" title="Active now" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{m.username}</div>
                      <div className="text-xs text-[var(--text-muted)]">{m.orgRole}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Teams</span><span className="font-medium text-[var(--text-primary)]">{m.teamsCount}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Tasks</span><span className="font-medium text-[var(--text-primary)]">{m.tasksCount}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Priority</span><span className="font-medium text-[var(--text-primary)]">#{m.rolePriority ?? 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Last active</span><span className="font-medium text-[var(--text-primary)]">{m.lastActive || 'No activity'}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Text className="text-xs text-[var(--text-muted)]">Task workload</Text>
              <div className="space-y-2">
                {[compareMembers.memberA, compareMembers.memberB].map((m) => {
                  const maxTasks = Math.max(compareMembers.memberA.tasksCount, compareMembers.memberB.tasksCount, 1);
                  const pct = Math.round((m.tasksCount / maxTasks) * 100);
                  return (
                    <div key={m.username} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-secondary)] w-24 truncate">{m.username}</span>
                      <div className="flex-1 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} className="h-full rounded-full bg-[var(--accent)]" />
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)] w-6 text-right">{m.tasksCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Text className="text-xs text-[var(--text-muted)]">Shared teams ({compareMembers.sharedTeams.length})</Text>
              {compareMembers.sharedTeams.length > 0 ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                  {compareMembers.sharedTeams.map((team) => (
                    <span key={team.id || team.name} className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[var(--text-muted)]" />
                      {team.name}
                    </span>
                  ))}
                </div>
              ) : (
                <Text size="xs" variant="muted">These members don't share any teams.</Text>
              )}
            </div>
          </div>
        </ModalContent>
      )}
    </Modal>
  );
}