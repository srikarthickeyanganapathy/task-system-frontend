import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import { Checkbox } from '@/shared/ui/Checkbox';
import { IconButton } from '@/shared/ui/Button';
import { Icons } from '@/shared/ui/Icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/Popover';
import { Mail, Users, FolderKanban, Eye, ArrowUp, ArrowDown, ArrowUpDown, Columns, Clock } from '@/shared/ui/Icons';
import { cn } from '@/shared/lib/cn';
import { SPRINGS } from '@/shared/lib/uxTokens';
import { toast } from 'sonner';
import { avatarColor, GLASS_PANEL } from './directoryUtils';

// --- Sortable header ---
function SortableHeader({ label, sortKey, currentSort, onSort }) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort?.direction : null;
  const ArrowIcon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn('flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors', isActive && 'text-[var(--accent)] hover:text-[var(--accent)]')}
    >
      {label}
      <ArrowIcon className={cn('w-3 h-3', isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-40')} />
    </button>
  );
}

const COLUMN_DEFS = [
  { id: 'username', label: 'Name', alwaysOn: true },
  { id: 'orgRole', label: 'Role', alwaysOn: false },
  { id: 'email', label: 'Email', alwaysOn: false },
  { id: 'teams', label: 'Teams', alwaysOn: false },
  { id: 'workload', label: 'Tasks', alwaysOn: false },
  { id: 'joined', label: 'Joined', alwaysOn: false },
  { id: 'status', label: 'Status', alwaysOn: false },
];

// --- Column visibility toggle -- floating popover, glass ---
function ColumnVisibilityToggle({ visibleColumns, onToggle }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton variant="ghost" size="sm" className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Toggle columns" aria-label="Toggle columns">
          <Columns className="w-4 h-4" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent className={cn('w-48 p-1.5 rounded-lg', GLASS_PANEL)} align="end">
        {COLUMN_DEFS.map((col) => (
          <label key={col.id} className={cn('flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors', col.alwaysOn ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[var(--bg-subtle)]/60')}>
            <Checkbox checked={col.alwaysOn ? true : visibleColumns.includes(col.id)} onCheckedChange={() => !col.alwaysOn && onToggle(col.id)} disabled={col.alwaysOn} />
            <span className="text-xs text-[var(--text-primary)]">{col.label}</span>
            {col.alwaysOn && <span className="text-[10px] text-[var(--text-muted)] ml-auto">required</span>}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function useSortedMembers(members, sort, memberTeamsMap, memberTasksMap) {
  return useMemo(() => {
    if (!sort?.key) return members;
    const sorted = [...members];
    const dir = sort.direction === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sort.key) {
        case 'username':
          return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase()) * dir;
        case 'orgRole':
          return ((a.rolePriority ?? 999) - (b.rolePriority ?? 999)) * dir;
        case 'teams':
          return ((memberTeamsMap[a.userId] || []).length - (memberTeamsMap[b.userId] || []).length) * dir;
        case 'workload':
          return ((memberTasksMap[a.userId] || []).length - (memberTasksMap[b.userId] || []).length) * dir;
        default:
          return 0;
      }
    });
    return sorted;
  }, [members, sort, memberTeamsMap, memberTasksMap]);
}

export function DirectoryTableView({
  members = [],
  isLoading,
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
  memberTeamsMap = {},
  memberTasksMap = {},
  roles = [],
  onUpdateRole,
  onRemoveMember,
  onSelectMember,
  canManageRoles,
  canRemoveMembers,
  currentUserId,
  adminCount,
}) {
  const [sort, setSort] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(['orgRole', 'email', 'teams', 'workload', 'joined', 'status']);
  const [updatedRoles, setUpdatedRoles] = useState({});

  const sortedMembers = useSortedMembers(members, sort, memberTeamsMap, memberTasksMap);
  const isAllSelected = sortedMembers.length > 0 && sortedMembers.every((m) => selectedIds.includes(m.userId));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSort = useCallback((key) => {
    setSort((prev) => {
      if (prev?.key === key) return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      return { key, direction: 'asc' };
    });
  }, []);

  const handleToggleColumn = useCallback((colId) => {
    setVisibleColumns((prev) => (prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]));
  }, []);

  const handleRoleChange = useCallback(async (userId, roleId) => {
    try {
      await onUpdateRole?.(userId, roleId);
      setUpdatedRoles((prev) => ({ ...prev, [userId]: Date.now() }));
      setTimeout(() => setUpdatedRoles((prev) => { const next = { ...prev }; delete next[userId]; return next; }), 2500);
    } catch (err) {
      toast.error('Failed to update role');
    }
  }, [onUpdateRole]);

  const columns = useMemo(() => {
    const cols = [];

    cols.push({
      id: 'select',
      header: () => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)} onCheckedChange={() => onToggleAll && onToggleAll(sortedMembers.map((m) => m.userId))} aria-label="Select all rows" />
        </div>
      ),
      cell: ({ row }) => {
        const member = row.original;
        const isSelf = member.userId === currentUserId;
        const isLastAdmin = adminCount <= 1 && member.rolePriority === 0;
        const disabled = isSelf || isLastAdmin;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selectedIds.includes(member.userId)} onCheckedChange={() => !disabled && onToggleSelect && onToggleSelect(member.userId)} disabled={disabled} aria-label="Select member" />
          </div>
        );
      },
    });

    cols.push({
      accessorKey: 'username',
      header: () => <SortableHeader label="Member" sortKey="username" currentSort={sort} onSort={handleSort} />,
      cell: ({ row }) => {
        const member = row.original;
        const isSelf = member.userId === currentUserId;
        const isSuspended = member.status === 'SUSPENDED';

        return (
          <div className="flex items-center gap-3 py-0.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-white text-sm shrink-0 relative" style={{ backgroundColor: avatarColor(member.username || '?') }}>
              {member.username?.charAt(0).toUpperCase() || '?'}
              {isSuspended && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--danger)] rounded-full border border-[var(--bg-card)]" title="Suspended" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium text-sm', isSuspended ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]')}>
                  {member.username}
                </span>
                {isSelf && <span className="text-xs text-[var(--text-muted)]">(You)</span>}
              </div>
              {visibleColumns.includes('email') && (
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] truncate">
                  <Mail className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span>{member.email || 'No email provided'}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    });

    if (visibleColumns.includes('orgRole')) {
      cols.push({
        accessorKey: 'orgRole',
        header: () => <SortableHeader label="Role" sortKey="orgRole" currentSort={sort} onSort={handleSort} />,
        cell: ({ row }) => {
          const member = row.original;
          const priority = member.rolePriority ?? 99;
          const justUpdated = updatedRoles[member.userId];
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-sm font-medium', priority === 0 ? 'text-[var(--danger)]' : priority === 1 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]')}>
                  {member.orgRole}
                </span>
                <AnimatePresence>
                  {justUpdated && (
                    <motion.span
                      key={`updated-${justUpdated}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={SPRINGS.fast}
                      className="text-xs text-[var(--success)]"
                    >
                      Updated
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="text-xs text-[var(--text-muted)]">Rank #{priority}</div>
            </div>
          );
        },
      });
    }

    if (visibleColumns.includes('teams')) {
      cols.push({
        id: 'teams',
        header: () => <SortableHeader label="Teams" sortKey="teams" currentSort={sort} onSort={handleSort} />,
        cell: ({ row }) => {
          const teams = memberTeamsMap[row.original.userId] || [];
          if (teams.length === 0) return <span className="text-xs text-[var(--text-muted)]">Unassigned</span>;
          return (
            <span className="text-xs text-[var(--text-secondary)]">
              {teams.slice(0, 2).map((t) => t.name).join(', ')}
              {teams.length > 2 && ` +${teams.length - 2}`}
            </span>
          );
        },
      });
    }

    if (visibleColumns.includes('workload')) {
      cols.push({
        id: 'workload',
        header: () => <SortableHeader label="Tasks" sortKey="workload" currentSort={sort} onSort={handleSort} />,
        cell: ({ row }) => {
          const tasks = memberTasksMap[row.original.userId] || [];
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <FolderKanban className={cn('w-3.5 h-3.5', tasks.length > 0 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')} />
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          );
        },
      });
    }

    if (visibleColumns.includes('joined')) {
      cols.push({
        id: 'joined',
        header: () => <span className="text-xs font-medium text-[var(--text-muted)]">Joined</span>,
        cell: ({ row }) => {
          const joinedDate = row.original.createdAt || row.original.joinedAt;
          if (!joinedDate) return <span className="text-xs text-[var(--text-muted)]">--</span>;
          return (
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              {new Date(joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          );
        },
      });
    }

    if (visibleColumns.includes('status')) {
      cols.push({
        id: 'status',
        header: () => <span className="text-xs font-medium text-[var(--text-muted)]">Status</span>,
        cell: ({ row }) => {
          const member = row.original;
          const isSuspended = member.status === 'SUSPENDED';
          return (
            <span className={cn('text-xs font-medium', isSuspended ? 'text-[var(--danger)]' : 'text-[var(--success)]')}>
              {member.status || 'ACTIVE'}
            </span>
          );
        },
      });
    }

    cols.push({
      id: 'actions',
      header: () => (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Actions</span>
          <ColumnVisibilityToggle visibleColumns={visibleColumns} onToggle={handleToggleColumn} />
        </div>
      ),
      cell: ({ row }) => {
        const member = row.original;
        const currentRole = roles.find((r) => r.name === member.orgRole);
        const isSelf = member.userId === currentUserId;
        const isLastAdmin = adminCount <= 1 && member.rolePriority === 0;

        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {canManageRoles || canRemoveMembers ? (
              <>
                {canManageRoles && (
                  <Select value={currentRole?.id?.toString() ?? ''} onValueChange={(val) => handleRoleChange(member.userId, parseInt(val, 10))} disabled={isSelf || isLastAdmin}>
                    <SelectTrigger className="w-[110px] h-7 text-xs">
                      <SelectValue placeholder={member.orgRole || 'Role'} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {canRemoveMembers && !isSelf && !isLastAdmin && (
                  <IconButton variant="ghost" size="sm" className="h-7 w-7 text-[var(--danger)]" title="Remove member" aria-label="Remove member" onClick={() => onRemoveMember && onRemoveMember(member)}>
                    <Icons.trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                )}
              </>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">No permissions</span>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [sortedMembers, selectedIds, isAllSelected, isIndeterminate, memberTeamsMap, memberTasksMap, roles, canManageRoles, canRemoveMembers, currentUserId, adminCount, sort, updatedRoles, visibleColumns, onToggleAll, onToggleSelect, handleSort, handleToggleColumn, handleRoleChange, onRemoveMember]);

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={sortedMembers}
        getRowId={(row) => row.userId ?? row.id}
        isLoading={isLoading}
        emptyStateTitle="No organization members found"
        emptyStateDescription="Try adjusting your search query or role filters."
        onRowClick={(member) => onSelectMember && onSelectMember(member)}
      />
    </div>
  );
}