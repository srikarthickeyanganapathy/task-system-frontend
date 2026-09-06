import React, { useState, useMemo } from 'react';
import { Drawer, DrawerContent } from '@/shared/ui/Drawer';
import { motion } from 'framer-motion';
import { Heading, Text } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';
import { cn } from '@/shared/lib/cn';
import {
  Mail, Shield, Users, CheckSquare, Trash2, Clock, MessageSquare, Copy, Check,
  BarChart3, FolderKanban, Settings, Tag,
} from '@/shared/ui/Icons';
import { toast } from 'sonner';
import { avatarColor, timeAgo } from './directoryUtils';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'bg-[var(--accent)]', textColor: 'text-[var(--accent)]' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-[var(--warning)]', textColor: 'text-[var(--warning)]' },
  IN_REVIEW: { label: 'In review', color: 'bg-[var(--info)]', textColor: 'text-[var(--info)]' },
  DONE: { label: 'Done', color: 'bg-[var(--success)]', textColor: 'text-[var(--success)]' },
  COMPLETED: { label: 'Completed', color: 'bg-[var(--success)]', textColor: 'text-[var(--success)]' },
  TODO: { label: 'To do', color: 'bg-[var(--text-muted)]', textColor: 'text-[var(--text-muted)]' },
  BLOCKED: { label: 'Blocked', color: 'bg-[var(--danger)]', textColor: 'text-[var(--danger)]' },
};

function getStatusConfig(status) {
  const key = (status || '').toUpperCase();
  return STATUS_CONFIG[key] || { label: status || 'Unknown', color: 'bg-[var(--text-muted)]', textColor: 'text-[var(--text-muted)]' };
}

const PERMISSION_GROUPS = {
  Projects: { prefixes: ['project', 'projects', 'proj'], icon: FolderKanban },
  Tasks: { prefixes: ['task', 'tasks', 'todo'], icon: CheckSquare },
  Teams: { prefixes: ['team', 'teams', 'member', 'members'], icon: Users },
  Admin: { prefixes: ['admin', 'org', 'organization', 'billing', 'settings', 'config'], icon: Settings },
};

function groupPermissions(permissions = []) {
  const groups = { Projects: [], Tasks: [], Teams: [], Admin: [], Other: [] };
  permissions.forEach((perm) => {
    const lower = perm.toLowerCase();
    let assigned = false;
    for (const [groupName, config] of Object.entries(PERMISSION_GROUPS)) {
      if (config.prefixes.some((p) => lower.startsWith(p))) {
        groups[groupName].push(perm);
        assigned = true;
        break;
      }
    }
    if (!assigned) groups.Other.push(perm);
  });
  return Object.fromEntries(Object.entries(groups).filter(([, perms]) => perms.length > 0));
}

const GROUP_ICONS = { Projects: FolderKanban, Tasks: CheckSquare, Teams: Users, Admin: Settings, Other: Tag };

export function MemberDetailDrawer({
  isOpen,
  onClose,
  member,
  roles = [],
  memberTeams = [],
  memberTasks,
  activeTaskCount,
  canManageRoles,
  canRemoveMembers,
  onUpdateRole,
  onRoleChange,
  onRemoveMember,
  isUpdatingRole,
  isRemovingMember,
  isSelf,
  isLastAdmin,
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const tasks = memberTasks || [];
  const taskCount = activeTaskCount ?? tasks.length;
  const updateRole = onUpdateRole || onRoleChange;

  const recentTasks = useMemo(() => {
    return [...tasks].filter((t) => t.updatedAt).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  }, [tasks]);

  const workloadDistribution = useMemo(() => {
    const dist = { active: 0, inReview: 0, done: 0, other: 0 };
    tasks.forEach((task) => {
      const status = (task.status || '').toUpperCase();
      if (['ACTIVE', 'IN_PROGRESS', 'TODO'].includes(status)) dist.active++;
      else if (['IN_REVIEW', 'REVIEW'].includes(status)) dist.inReview++;
      else if (['DONE', 'COMPLETED'].includes(status)) dist.done++;
      else dist.other++;
    });
    return dist;
  }, [tasks]);

  const permissionGroups = useMemo(() => groupPermissions(member?.permissions || []), [member]);

  const teamRoles = useMemo(() => {
    if (!member) return [];
    return memberTeams.map((team) => {
      const teamMembers = team.members || [];
      const membership = teamMembers.find((tm) => {
        const tmId = tm.userId ?? tm.id ?? tm;
        return tmId === member.userId || (tm.username && tm.username === member.username);
      });
      return {
        team,
        role: membership?.role || membership?.teamRole || 'Member',
        isOwner: membership?.role === 'OWNER' || membership?.isOwner || false,
      };
    });
  }, [member, memberTeams]);

  const handleCopyEmail = async () => {
    if (!member?.email) return;
    try {
      await navigator.clipboard.writeText(member.email);
      setCopiedEmail(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      toast.error('Failed to copy email');
    }
  };

  if (!member) return null;

  const currentRole = roles.find((r) => r.name === member.orgRole);
  const isSuspended = member.status === 'SUSPENDED';
  const maxWorkload = Math.max(workloadDistribution.active, workloadDistribution.inReview, workloadDistribution.done, 1);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent side="right" className="sm:max-w-md p-0 flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-subtle)]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-medium text-white shrink-0" style={{ backgroundColor: avatarColor(member.username || '?') }}>
              {member.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <Heading level={3} className="text-base font-medium text-[var(--text-primary)] truncate">
                {member.username}
                {isSuspended && <span className="text-[var(--danger)] text-sm font-normal ml-2">Suspended</span>}
              </Heading>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-0.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{member.email || 'No email provided'}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className={cn('font-medium', member.rolePriority === 0 ? 'text-[var(--danger)]' : member.rolePriority === 1 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]')}>
                  {member.orgRole}
                </span>
                <span className="text-[var(--border-default)]">·</span>
                <span className="text-[var(--text-muted)]">Priority {member.rolePriority ?? 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" /> View tasks
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5" onClick={handleCopyEmail} disabled={!member.email}>
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
              Copy email
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick stats */}
          <div className="flex items-center gap-6">
            <div><div className="text-lg font-semibold text-[var(--text-primary)]">{memberTeams.length}</div><Text variant="muted" size="xs">Teams</Text></div>
            <div><div className="text-lg font-semibold text-[var(--text-primary)]">{taskCount}</div><Text variant="muted" size="xs">Tasks</Text></div>
            <div><div className="text-lg font-semibold text-[var(--text-primary)]">{member.permissions?.length || 0}</div><Text variant="muted" size="xs">Permissions</Text></div>
          </div>

          {/* Recent activity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <Text className="text-xs text-[var(--text-muted)]">Recent activity</Text>
            </div>
            {recentTasks.length === 0 ? (
              <Text size="xs" variant="muted">No recent task activity.</Text>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                {recentTasks.map((task, idx) => {
                  const statusConfig = getStatusConfig(task.status);
                  return (
                    <motion.div key={task.id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="flex items-center gap-3 py-2.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--text-primary)] truncate">{task.title || 'Untitled task'}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className={statusConfig.textColor}>{statusConfig.label}</span>
                          {task.updatedAt && <span className="text-[var(--text-muted)]">{timeAgo(new Date(task.updatedAt))}</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workload distribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <Text className="text-xs text-[var(--text-muted)]">Workload distribution</Text>
            </div>
            {tasks.length === 0 ? (
              <Text size="xs" variant="muted">No tasks assigned.</Text>
            ) : (
              <div className="space-y-2">
                {[
                  { key: 'active', label: 'Active', count: workloadDistribution.active, color: 'bg-[var(--accent)]' },
                  { key: 'inReview', label: 'In review', count: workloadDistribution.inReview, color: 'bg-[var(--info)]' },
                  { key: 'done', label: 'Done', count: workloadDistribution.done, color: 'bg-[var(--success)]' },
                ].map((item) => (
                  <div key={item.key} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                      <span className="text-[var(--text-primary)] font-medium tabular-nums">{item.count}</span>
                    </div>
                    <div className="h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(item.count / maxWorkload) * 100}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} className={cn('h-full rounded-full', item.color)} />
                    </div>
                  </div>
                ))}
                {workloadDistribution.other > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Other</span>
                    <span className="text-[var(--text-muted)] tabular-nums">{workloadDistribution.other}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team affiliations */}
          <div className="space-y-2">
            <Text className="text-xs text-[var(--text-muted)]">Team affiliations</Text>
            {teamRoles.length === 0 ? (
              <Text size="xs" variant="muted">Not assigned to any teams.</Text>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                {teamRoles.map(({ team, role, isOwner }) => (
                  <div key={team.id || team.name} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      {team.name}
                    </span>
                    <span className={cn('text-xs font-medium', isOwner ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]')}>{role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Text className="text-xs text-[var(--text-muted)]">Access & permissions</Text>
            {Object.keys(permissionGroups).length === 0 ? (
              <Text size="xs" variant="muted">No specific permissions assigned.</Text>
            ) : (
              <div className="space-y-3">
                {Object.entries(permissionGroups).map(([groupName, perms]) => {
                  const IconComponent = GROUP_ICONS[groupName] || Tag;
                  return (
                    <div key={groupName} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <IconComponent className="w-3 h-3 text-[var(--text-muted)]" />
                        {groupName} ({perms.length})
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[18px] text-xs text-[var(--text-muted)]">
                        {perms.map((perm) => <span key={perm}>{perm.replace(/_/g, ' ')}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {(canManageRoles || canRemoveMembers) && (
          <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
            {canManageRoles && (
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Change role</label>
                <Select value={currentRole?.id?.toString() ?? ''} onValueChange={(val) => updateRole?.(member.userId, parseInt(val, 10))} disabled={isUpdatingRole || (isLastAdmin && member.rolePriority === 0)}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder={member.orgRole || 'Select role'} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {canRemoveMembers && !isSelf && !isLastAdmin && (
              <Button variant="ghost" size="sm" className="mt-5 h-8 text-[var(--danger)]" onClick={() => onRemoveMember(member)} disabled={isRemovingMember}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}