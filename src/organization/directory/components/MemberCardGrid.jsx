import React from 'react';
import { EntityCard } from '@/shared/ui/entity-card';
import { Checkbox } from '@/shared/ui/Checkbox';
import { IconButton } from '@/shared/ui/Button';
import { Icons } from '@/shared/ui/Icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';
import { Clock, Users, FolderKanban } from '@/shared/ui/Icons';
import { avatarColor, formatLastActive, hasRecentActivity } from './directoryUtils';

export function MemberCardGrid({
  membersList,
  selectedIds,
  onToggleSelect,
  onSelectMember,
  memberTeamsMap,
  memberTasksMap,
  roles,
  updateRoleMutation,
  removeMemberMutation,
  canManageRoles,
  canRemoveMembers,
  user,
  confirm,
  adminCount,
  allVisibleIds,
  onToggleAll,
  avgTasksPerMember = 0,
}) {
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-1">
        <Checkbox checked={isAllSelected} onCheckedChange={() => onToggleAll(allVisibleIds)} aria-label="Select all displayed cards" />
        <span className="cursor-pointer" onClick={() => onToggleAll(allVisibleIds)}>
          {isAllSelected ? 'Unselect all' : 'Select all'}
        </span>
      </div>

      <div className="ec-grid">
        {membersList.map((member) => {
          const currentRole = roles.find((r) => r.name === member.orgRole);
          const isSelf = member.userId === user?.id;
          const isLastAdmin = adminCount <= 1 && member.rolePriority === 0;
          const isSuspended = member.status === 'SUSPENDED';
          const isSelected = selectedIds.includes(member.userId);
          const disabledSelect = isSelf || isLastAdmin;
          const teams = memberTeamsMap[member.userId] || [];
          const tasks = memberTasksMap[member.userId] || [];
          const isActiveNow = hasRecentActivity(memberTasksMap, member.userId, 24);
          const lastActive = formatLastActive(memberTasksMap, member.userId);
          const maxWorkload = Math.max(avgTasksPerMember, tasks.length, 1);

          return (
            <EntityCard
              key={member.userId}
              type="member"
              name={member.username + (isSelf ? ' (You)' : '')}
              tagline={`${member.orgRole || 'Member'}${isSuspended ? ' · Suspended' : ''}`}
              selected={isSelected}
              disabled={isSuspended}
              onClick={() => onSelectMember(member)}
              glyph={
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white text-sm" style={{ backgroundColor: avatarColor(member.username || '?') }}>
                    {member.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {isActiveNow && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] border-2 border-[var(--bg-card)] rounded-full ring-2 ring-[var(--success)]/20" title="Active in last 24h" />}
                  {isSuspended && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--danger)] border-2 border-[var(--bg-card)] rounded-full" title="Suspended" />}
                </div>
              }
              actions={
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onCheckedChange={() => !disabledSelect && onToggleSelect(member.userId)} disabled={disabledSelect} aria-label={`Select ${member.username}`} />
                </div>
              }
              meta={[
                { icon: <Clock style={{ width: 11, height: 11 }} />, text: lastActive ? `Active ${lastActive}` : 'No recent activity' },
                { icon: <Users style={{ width: 11, height: 11 }} />, text: teams.length > 0 ? teams.slice(0, 2).map((t) => t.name).join(', ') + (teams.length > 2 ? ` +${teams.length - 2}` : '') : 'No team assigned' },
                { icon: <FolderKanban style={{ width: 11, height: 11 }} />, text: `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}` },
              ]}
              progress={maxWorkload > 0 ? Math.round((tasks.length / maxWorkload) * 100) : 0}
              footer={
                <div className="ec-card-foot">
                  <span className="text-xs text-[var(--text-muted)]">Rank #{member.rolePriority ?? 'N/A'}</span>
                  {(canManageRoles || canRemoveMembers) && (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {canManageRoles && (
                        <Select
                          value={currentRole?.id?.toString() ?? ''}
                          onValueChange={(val) => updateRoleMutation.mutate({ userId: member.userId, roleId: parseInt(val, 10) })}
                          disabled={updateRoleMutation.isPending || isSelf || isLastAdmin}
                        >
                          <SelectTrigger className="w-[100px] h-7 text-xs">
                            <SelectValue placeholder={member.orgRole || 'Role'} />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {canRemoveMembers && !isSelf && !isLastAdmin && (
                        <IconButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 text-[var(--danger)]"
                          title="Remove member"
                          aria-label="Remove member"
                          onClick={async () => {
                            if (await confirm({ title: `Remove ${member.username} from organization?`, danger: true })) {
                              removeMemberMutation.mutate(member.userId);
                            }
                          }}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Icons.trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      )}
                    </div>
                  )}
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}