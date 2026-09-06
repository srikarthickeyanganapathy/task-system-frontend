import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/Select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/Popover';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/shared/ui/Modal';
import {
  Download,
  X,
  AlertTriangle,
  Users,
  Bookmark,
  Search,
  Megaphone,
  ChevronDown,
  Star,
  User,
  Zap,
  Icons,
} from '@/shared/ui/Icons';
import { cn } from '@/shared/lib/cn';
import { SPRINGS } from '@/shared/lib/uxTokens';
import { toast } from 'sonner';
import { GLASS_PANEL, GLASS_FLOATING, avatarColor } from './directoryUtils';

// --- Saved filter presets ---
const SAVED_VIEWS = [
  { id: 'all', label: 'All members', icon: Users, description: 'Clear all filters', filters: { role: 'ALL', team: 'ALL' } },
  { id: 'management', label: 'Management team', icon: Star, description: 'Admins & directors only', filters: { role: 'MANAGEMENT', team: 'ALL' } },
  { id: 'unassigned', label: 'Unassigned members', icon: User, description: 'No team membership', filters: { role: 'ALL', team: 'UNASSIGNED' } },
  { id: 'recently-active', label: 'Recently active', icon: Zap, description: 'Task activity in 7 days', filters: { role: 'ALL', team: 'RECENTLY_ACTIVE' } },
];

// --- Search suggestions dropdown (floating -> glass) ---
function SearchSuggestions({ query, members, onSelect, visible }) {
  const suggestions = useMemo(() => {
    if (!query || query.trim().length < 1) return [];
    const q = query.toLowerCase();
    return members.filter((m) => (m.username || '').toLowerCase().includes(q)).slice(0, 5);
  }, [query, members]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={SPRINGS.fast}
      className={cn('absolute top-full left-0 right-0 mt-1.5 rounded-lg z-30 overflow-hidden', GLASS_PANEL)}
    >
      <div className="px-3 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
        Quick jump to member
      </div>
      {suggestions.map((member) => (
        <button
          key={member.userId}
          type="button"
          onClick={() => onSelect(member)}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-subtle)]/60 transition-colors text-left group"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
            style={{ backgroundColor: avatarColor(member.username || '?') }}
          >
            {member.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
              {member.username}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">{member.orgRole || 'Member'}</div>
          </div>
        </button>
      ))}
    </motion.div>
  );
}

export function DirectoryFilterBar({
  roles = [],
  teams = [],
  selectedRole,
  onRoleChange,
  selectedTeam,
  onTeamChange,
  onResetFilters,
  totalCount,
  filteredCount,
  members = [],
  onSelectMember,
  searchQuery = '',
  onSearchChange,
  onApplyPreset,
}) {
  const isFiltered = selectedRole !== 'ALL' || selectedTeam !== 'ALL';
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedViewOpen, setSavedViewOpen] = useState(false);

  const handlePresetSelect = useCallback((preset) => {
    setSavedViewOpen(false);
    if (preset.id === 'all') {
      onResetFilters?.();
      return;
    }
    onApplyPreset?.(preset.filters);
    toast.success(`Applied "${preset.label}" view`);
  }, [onResetFilters, onApplyPreset]);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery && searchQuery.trim().length > 0) setShowSuggestions(true);
  }, [searchQuery]);

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  const handleSearchChange = useCallback((e) => {
    onSearchChange?.(e.target.value);
    setShowSuggestions(true);
  }, [onSearchChange]);

  const handleSuggestionSelect = useCallback((member) => {
    setShowSuggestions(false);
    onSelectMember?.(member);
  }, [onSelectMember]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-lg border border-[var(--border-subtle)]">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-sm text-[var(--text-muted)] pr-1">Filter:</span>

        {/* Saved views -- floating popover, glass */}
        <Popover open={savedViewOpen} onOpenChange={setSavedViewOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              Saved views
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn('w-56 p-1.5 rounded-lg', GLASS_PANEL)} align="start">
            {SAVED_VIEWS.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => handlePresetSelect(view)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-[var(--bg-subtle)]/60 transition-colors text-left group"
                >
                  <Icon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {view.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">{view.description}</div>
                  </div>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        <Select value={selectedRole || 'ALL'} onValueChange={onRoleChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {roles.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedTeam || 'ALL'} onValueChange={onTeamChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All teams</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id?.toString() ?? t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex items-center gap-1.5 border border-[var(--border-subtle)] rounded-lg px-2.5 h-8 min-w-[180px] focus-within:border-[var(--accent-border)] transition-colors">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder="Search members"
              className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full"
            />
            {searchQuery && (
              <button type="button" onClick={() => { onSearchChange?.(''); setShowSuggestions(false); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <AnimatePresence>
            {showSuggestions && searchQuery && (
              <SearchSuggestions query={searchQuery} members={members} onSelect={handleSuggestionSelect} visible={showSuggestions} />
            )}
          </AnimatePresence>
        </div>

        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
          {filteredCount} of {totalCount} members
        </span>
      </div>
    </div>
  );
}

export function DirectoryBulkActionsBar({
  selectedIds = [],
  onClearSelection,
  allMembers = [],
  memberTeamsMap = {},
  memberTasksMap = {},
  roles = [],
  onBulkUpdateRole,
  onBulkRemove,
  canManageRoles,
  canRemoveMembers,
  currentUserId,
}) {
  const [roleSelectValue, setRoleSelectValue] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [typeInput, setTypeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedMembers = allMembers.filter((m) => selectedIds.includes(m.userId));
  const hasSelected = selectedIds.length > 0;
  const requireTypeConfirm = selectedIds.length > 5;

  const handleExportCSV = useCallback(() => {
    try {
      const targetMembers = selectedMembers.length > 0 ? selectedMembers : allMembers;
      const headers = ['User ID', 'Username', 'Email', 'Org Role', 'Priority Rank', 'Assigned Teams Count', 'Active Tasks Count'];
      const rows = targetMembers.map((m) => {
        const teamsCount = (memberTeamsMap[m.userId] || []).length;
        const tasksCount = (memberTasksMap[m.userId] || []).length;
        return [
          `"${m.userId}"`,
          `"${(m.username || '').replace(/"/g, '""')}"`,
          `"${m.email || 'N/A'}"`,
          `"${m.orgRole || 'MEMBER'}"`,
          m.rolePriority ?? 99,
          teamsCount,
          tasksCount,
        ].join(',');
      });
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ryokai_selected_members_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${targetMembers.length} member records to CSV`);
    } catch (err) {
      toast.error('Failed to generate CSV file');
      console.error(err);
    }
  }, [selectedMembers, allMembers, memberTeamsMap, memberTasksMap]);

  const handleSendAnnouncement = useCallback(() => {
    toast('Announcements coming soon', {
      description: `Broadcasting to ${selectedIds.length} selected members will be available in a future update.`,
      duration: 3000,
    });
  }, [selectedIds]);

  const handleRoleSelect = async (roleIdStr) => {
    const roleId = parseInt(roleIdStr, 10);
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole || !onBulkUpdateRole) return;

    setIsProcessing(true);
    toast.loading(`Updating role to ${targetRole.name} for ${selectedIds.length} members`, { id: 'bulk-role' });
    try {
      await onBulkUpdateRole(selectedIds, roleId, targetRole.name);
      toast.success(`Updated ${selectedIds.length} member roles`, { id: 'bulk-role' });
      setRoleSelectValue('');
      onClearSelection();
    } catch (err) {
      toast.error('Some role updates could not be completed', { id: 'bulk-role' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiateRemove = () => {
    setTypeInput('');
    setConfirmModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (requireTypeConfirm && typeInput.trim().toUpperCase() !== 'CONFIRM') {
      toast.error('Type CONFIRM to proceed with batch removal.');
      return;
    }
    setIsProcessing(true);
    toast.loading(`Removing ${selectedIds.length} members`, { id: 'bulk-remove' });
    try {
      await onBulkRemove(selectedIds);
      toast.success('Batch removal complete', { id: 'bulk-remove' });
      setConfirmModalOpen(false);
      onClearSelection();
    } catch (err) {
      toast.error('Some removals could not be processed', { id: 'bulk-remove' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {hasSelected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={cn(
              'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:max-w-3xl rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4',
              GLASS_FLOATING
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-white font-medium text-xs">
                {selectedIds.length}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedIds.length} {selectedIds.length === 1 ? 'member' : 'members'} selected
                </p>
                <button
                  type="button"
                  onClick={onClearSelection}
                  disabled={isProcessing}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Clear selection
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <Button variant="ghost" size="sm" onClick={handleSendAnnouncement} disabled={isProcessing} className="text-xs h-8 gap-1.5">
                <Megaphone className="w-3.5 h-3.5" /> Announce
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={isProcessing} className="text-xs h-8 gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
              {canManageRoles && (
                <Select value={roleSelectValue} onValueChange={handleRoleSelect} disabled={isProcessing}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Change role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => <SelectItem key={role.id} value={role.id.toString()}>Set {role.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {canRemoveMembers && (
                <Button variant="danger" size="sm" onClick={handleInitiateRemove} disabled={isProcessing} className="text-xs h-8 gap-1.5">
                  <Icons.trash2 className="w-3.5 h-3.5" /> Remove ({selectedIds.length})
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal -- glass chrome, flat internal content */}
      <Modal open={confirmModalOpen} onOpenChange={(open) => { if (!isProcessing) setConfirmModalOpen(open); }}>
        <ModalContent className={cn('max-w-md rounded-lg', GLASS_PANEL)}>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-[var(--danger)] text-base font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Confirm batch removal
            </ModalTitle>
            <ModalDescription className="text-sm leading-relaxed pt-1">
              You're about to remove <strong className="text-[var(--text-primary)]">{selectedIds.length} members</strong> from
              the organization. Their task assignments and team allocations will be affected.
            </ModalDescription>
          </ModalHeader>

          <div className="py-3 space-y-3">
            <p className="text-xs text-[var(--danger)]">
              This will revoke workspace access for all selected accounts.
            </p>

            {requireTypeConfirm && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-[var(--text-secondary)] block">
                  Type <strong className="text-[var(--danger)] font-mono">CONFIRM</strong> to authorize:
                </label>
                <input
                  type="text"
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value)}
                  placeholder="CONFIRM"
                  disabled={isProcessing}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm font-medium text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--danger)] transition-all"
                />
              </div>
            )}
          </div>

          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)} disabled={isProcessing} className="text-sm">
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmRemove}
              disabled={isProcessing || (requireTypeConfirm && typeInput.trim() !== 'CONFIRM')}
              className="text-sm"
            >
              {isProcessing ? 'Removing...' : `Remove (${selectedIds.length})`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}