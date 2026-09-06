import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';
import {
  useOrgMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useOrgRoles,
  useOrgTeams,
} from '@/organization';
import { useTaskList } from '@/task';
import { toast } from 'sonner';
import { Heading, Text } from '@/shared/ui/Typography';
import { Info, Users } from '@/shared/ui/Icons';
import { Button } from '@/shared/ui/Button';
import { Icons } from '@/shared/ui/Icons';
import { PageShell, PageHero, PageContent } from '@/shared/ui/PageShell';
import { usePermissions } from '@/identity';
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog/ConfirmDialog';
import { InviteMemberModal } from '../../components/Invites/InviteMemberModal';
import { PageState } from '@/shared/ui/PageState';
import { PillNav } from '@/shared/ui/PillNav';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';
import { DirectoryOrgChart } from '../components/DirectoryOrgChart';
import { DirectoryTableView } from '../components/DirectoryTableView';
import { DirectoryBulkActionsBar } from '../components/DirectoryFilterAndBulkBar';
import { MemberCompareModal } from '../components/MemberCompareModal';
import { RecentActivityFeed } from '../components/RecentActivityFeed';
import { formatLastActive, hasRecentActivity } from '../components/directoryUtils';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useAuth } from '@/identity';
import { EntityFilterBar, EntityStatStrip } from '@/shared/ui/entity-card';
import { UserIcon, PieChart, BarChart3, Activity } from 'lucide-react';

export function DirectoryPage() {
  const { activeOrganization } = useWorkspace();
  const orgId = activeOrganization?.id;
  const { user } = useAuth();

  const { data: members = [], isLoading: isMembersLoading, isError: isMembersError, refetch: refetchMembers } = useOrgMembers(orgId);
  const { data: roles = [] } = useOrgRoles(orgId);
  const { data: teams = [], isLoading: isTeamsLoading, isError: isTeamsError, refetch: refetchTeams } = useOrgTeams(orgId);
  const { data: { tasks: allTasks = [] } = {}, isLoading: isTasksLoading, isError: isTaskssError, refetch: refetchTasks } = useTaskList({});

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    searchDebounceRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  const [viewMode, setViewMode] = useState('table');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerMember, setDrawerMember] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [activityFeedExpanded, setActivityFeedExpanded] = useState(false);

  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { canManageRoles, canInviteMembers, canRemoveMembers } = usePermissions();
  const updateRoleMutation = useUpdateMemberRole(orgId);
  const removeMemberMutation = useRemoveMember(orgId);

  const memberTeamsMap = useMemo(() => {
    const map = {};
    members.forEach((m) => { map[m.userId] = []; });
    teams.forEach((team) => {
      (team.members || []).forEach((tm) => {
        const targetId = tm.userId ?? tm.id ?? tm;
        if (map[targetId]) {
          map[targetId].push(team);
        } else {
          const foundByUsername = members.find((m) => m.username === (tm.username || tm));
          if (foundByUsername) {
            map[foundByUsername.userId] = map[foundByUsername.userId] || [];
            map[foundByUsername.userId].push(team);
          }
        }
      });
    });
    return map;
  }, [members, teams]);

  const memberTasksMap = useMemo(() => {
    const map = {};
    members.forEach((m) => { map[m.userId] = []; });
    allTasks.forEach((task) => {
      if (task.assigneeUsername) {
        const found = members.find((m) => m.username === task.assigneeUsername);
        if (found && map[found.userId]) map[found.userId].push(task);
      }
    });
    return map;
  }, [members, allTasks]);

  const analytics = useMemo(() => {
    const totalMembers = members.length;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newThisMonth = members.filter((m) => {
      const joinedDate = m.joinedAt || m.createdAt;
      return joinedDate && new Date(joinedDate) >= thirtyDaysAgo;
    }).length;

    const roleCounts = {};
    members.forEach((m) => { const role = m.orgRole || 'MEMBER'; roleCounts[role] = (roleCounts[role] || 0) + 1; });

    const membersWithTeams = members.filter((m) => (memberTeamsMap[m.userId] || []).length > 0).length;
    const teamsCoveragePct = totalMembers > 0 ? Math.round((membersWithTeams / totalMembers) * 100) : 0;
    const activeThisWeek = members.filter((m) => hasRecentActivity(memberTasksMap, m.userId, 24 * 7)).length;

    return { totalMembers, newThisMonth, roleCounts, teamsCoveragePct, activeThisWeek };
  }, [members, memberTeamsMap, memberTasksMap]);

  const avgTasksPerMember = useMemo(() => {
    if (members.length === 0) return 0;
    const total = Object.values(memberTasksMap).reduce((sum, tasks) => sum + tasks.length, 0);
    return Math.round((total / members.length) * 10) / 10;
  }, [members, memberTasksMap]);

  const filteredMembers = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();
    const now = new Date().getTime();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return members.filter((member) => {
      if (quickView === 'active') {
        const tasks = memberTasksMap[member.userId] || [];
        if (!tasks.some((t) => t.updatedAt && new Date(t.updatedAt) >= weekAgo)) return false;
      }
      if (quickView === 'unassigned' && (memberTeamsMap[member.userId] || []).length > 0) return false;
      if (quickView === 'admins' && member.rolePriority !== 0) return false;

      const nameMatch = !q || member.username?.toLowerCase().includes(q) || member.email?.toLowerCase().includes(q) || member.orgRole?.toLowerCase().includes(q);
      const roleMatch = selectedRoleFilter === 'ALL' || member.orgRole === selectedRoleFilter;
      const teamMatch = selectedTeamFilter === 'ALL' || (memberTeamsMap[member.userId] && memberTeamsMap[member.userId].some((t) => (t.id?.toString() ?? t.name) === selectedTeamFilter));
      return nameMatch && roleMatch && teamMatch;
    });
  }, [members, debouncedSearchQuery, selectedRoleFilter, selectedTeamFilter, memberTeamsMap, memberTasksMap, quickView]);

  const recentlyJoined = useMemo(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return members
      .filter((m) => { const joinedDate = m.joinedAt || m.createdAt; return joinedDate && new Date(joinedDate) >= thirtyDaysAgo; })
      .sort((a, b) => new Date(b.joinedAt || b.createdAt || 0) - new Date(a.joinedAt || a.createdAt || 0));
  }, [members]);

  const compareMembers = useMemo(() => {
    if (selectedIds.length !== 2) return null;
    const [idA, idB] = selectedIds;
    const memberA = members.find((m) => m.userId === idA);
    const memberB = members.find((m) => m.userId === idB);
    if (!memberA || !memberB) return null;

    const teamsA = memberTeamsMap[idA] || [];
    const teamsB = memberTeamsMap[idB] || [];
    const tasksA = memberTasksMap[idA] || [];
    const tasksB = memberTasksMap[idB] || [];
    const sharedTeams = teamsA.filter((ta) => teamsB.some((tb) => (tb.id || tb.name) === (ta.id || ta.name)));

    return {
      memberA: { ...memberA, teamsCount: teamsA.length, tasksCount: tasksA.length, lastActive: formatLastActive(memberTasksMap, idA), isActiveNow: hasRecentActivity(memberTasksMap, idA, 24) },
      memberB: { ...memberB, teamsCount: teamsB.length, tasksCount: tasksB.length, lastActive: formatLastActive(memberTasksMap, idB), isActiveNow: hasRecentActivity(memberTasksMap, idB, 24) },
      sharedTeams,
    };
  }, [selectedIds, members, memberTeamsMap, memberTasksMap]);

  const handleToggleSelect = useCallback((userId) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }, []);

  const handleToggleAll = useCallback((visibleIds) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => (allSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))));
  }, [selectedIds]);

  const handleBulkUpdateRole = async (targetIds, roleId) => {
    const results = await Promise.allSettled(targetIds.map((id) => updateRoleMutation.mutateAsync({ userId: id, roleId })));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) toast.warning(`${targetIds.length - failed} of ${targetIds.length} roles updated successfully.`);
  };

  const handleBulkRemove = async (targetIds) => {
    const results = await Promise.allSettled(targetIds.map((id) => removeMemberMutation.mutateAsync(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) toast.warning(`${targetIds.length - failed} of ${targetIds.length} members removed successfully.`);
  };

  if (!activeOrganization) return null;

  const isError = isMembersError || isTeamsError || isTaskssError;
  const isLoading = isMembersLoading || isTeamsLoading;
  const pageState = isError ? 'error' : isLoading ? 'loading' : 'ready';
  const handleRetry = () => { refetchMembers(); refetchTeams(); refetchTasks(); };
  const adminCount = members.filter((m) => m.rolePriority === 0).length;
  const isQuickViewActive = quickView !== null;

  return (
    <PageShell maxWidth="default">
      <PageHero
        eyebrow="People & governance"
        meta={`${members.length} member${members.length !== 1 ? 's' : ''} · ${teams.length} ${teams.length === 1 ? 'team' : 'teams'}`}
        title="Organization directory"
        subtitle={`Member roster and authority hierarchy for ${activeOrganization.name}.`}
        actions={
          canInviteMembers && (
            <Button variant="primary" onClick={() => setInviteModalOpen(true)}>
              <Icons.plus className="w-4 h-4 mr-1.5" />
              Invite member
            </Button>
          )
        }
      />

      <EntityFilterBar
        search={searchQuery}
        onSearch={setSearchQuery}
        searchPlaceholder="Search by name, role, or email"
        chips={[
          { id: 'all', label: 'All', count: members.length },
          { id: 'active', label: 'Active', count: analytics.activeThisWeek },
          { id: 'unassigned', label: 'Unassigned', count: members.filter((m) => (memberTeamsMap[m.userId] || []).length === 0).length },
          { id: 'admins', label: 'Admins', count: members.filter((m) => m.rolePriority === 0).length },
        ]}
        activeChip={quickView || 'all'}
        onChip={(id) => setQuickView(id === 'all' ? null : id)}
      >
        <PillNav items={[{ value: 'table', label: 'Table' }, { value: 'orgchart', label: 'Chart' }]} value={viewMode} onChange={setViewMode} />
        {selectedIds.length === 2 && (
          <Button variant="primary" size="sm" onClick={() => setCompareModalOpen(true)} className="gap-1.5 text-xs h-8">
            <Icons.gitCompare className="w-3.5 h-3.5" />
            Compare
          </Button>
        )}
      </EntityFilterBar>

      <PageContent>
        {pageState === 'ready' && members.length > 0 && (
          <EntityStatStrip
            stats={[
              { key: 'total', label: 'Total members', value: analytics.totalMembers, sublabel: analytics.newThisMonth > 0 ? `${analytics.newThisMonth} new this month` : 'Members', icon: Users },
              { key: 'roles', label: 'Roles', value: Object.keys(analytics.roleCounts || {}).length || '--', sublabel: 'Role distribution', icon: PieChart },
              { key: 'coverage', label: 'Coverage', value: `${analytics.teamsCoveragePct}%`, sublabel: 'Members in a team', icon: BarChart3 },
              { key: 'active', label: 'Active', value: analytics.activeThisWeek, sublabel: analytics.totalMembers > 0 ? `${Math.round((analytics.activeThisWeek / analytics.totalMembers) * 100)}% active this week` : 'No recent activity', icon: Activity },
            ]}
          />
        )}

        <PageState
          state={pageState}
          stateProps={{
            skeleton: <DirectorySkeleton />,
            loadingVariant: 'table',
            icon: UserIcon,
            title: 'No organization members found',
            description: 'Try adjusting your filter parameters or inviting new teammates.',
            onRetry: handleRetry,
          }}
        >
          {filteredMembers.length === 0 ? (
            <div className="text-center py-16 sm:py-20 border border-dashed border-[var(--border-subtle)] rounded-lg">
              <UserIcon className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
              <Text className="text-sm font-medium text-[var(--text-secondary)] mb-1">No members found</Text>
              <Text variant="muted" className="text-sm">
                {isQuickViewActive ? 'No members match the selected quick view.' : 'Try adjusting your search query or filters.'}
              </Text>
              {(selectedRoleFilter !== 'ALL' || selectedTeamFilter !== 'ALL' || searchQuery || isQuickViewActive) && (
                <Button variant="ghost" size="sm" onClick={() => { setSelectedRoleFilter('ALL'); setSelectedTeamFilter('ALL'); setSearchQuery(''); setQuickView(null); }} className="mt-4">
                  Reset all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Click any row to open the member profile. Use checkboxes for batch actions or CSV export.</span>
              </div>

              {viewMode === 'table' && (
                <DirectoryTableView
                  members={filteredMembers}
                  isLoading={isLoading}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleAll={handleToggleAll}
                  memberTeamsMap={memberTeamsMap}
                  memberTasksMap={memberTasksMap}
                  roles={roles}
                  onUpdateRole={(userId, roleId) => updateRoleMutation.mutate({ userId, roleId })}
                  onRemoveMember={async (member) => {
                    if (await confirm({ title: `Remove ${member.username} from organization?`, danger: true })) {
                      removeMemberMutation.mutate(member.userId);
                    }
                  }}
                  onSelectMember={setDrawerMember}
                  canManageRoles={canManageRoles}
                  canRemoveMembers={canRemoveMembers}
                  currentUserId={user?.id}
                  adminCount={adminCount}
                />
              )}

              {viewMode === 'orgchart' && (
                <DirectoryOrgChart
                  members={filteredMembers}
                  memberTeamsMap={memberTeamsMap}
                  memberTasksMap={memberTasksMap}
                  onSelectMember={setDrawerMember}
                  selectedMemberId={drawerMember?.userId}
                />
              )}
            </div>
          )}
        </PageState>

        {pageState === 'ready' && members.length > 0 && (
          <RecentActivityFeed
            recentlyJoined={recentlyJoined}
            expanded={activityFeedExpanded}
            onToggleExpanded={() => setActivityFeedExpanded((prev) => !prev)}
            onSelectMember={setDrawerMember}
          />
        )}
      </PageContent>

      <MemberCompareModal open={compareModalOpen && !!compareMembers} onOpenChange={(open) => !open && setCompareModalOpen(false)} compareMembers={compareMembers} />

      <MemberDetailDrawer
        isOpen={!!drawerMember}
        onClose={() => setDrawerMember(null)}
        member={drawerMember}
        memberTeams={drawerMember ? (memberTeamsMap[drawerMember.userId] || []) : []}
        memberTasks={drawerMember ? (memberTasksMap[drawerMember.userId] || []) : []}
        roles={roles}
        onUpdateRole={(userId, roleId) => updateRoleMutation.mutate({ userId, roleId })}
        onRemoveMember={async (member) => {
          if (await confirm({ title: `Remove ${member.username}?`, danger: true })) {
            removeMemberMutation.mutate(member.userId);
            setDrawerMember(null);
          }
        }}
        canManageRoles={canManageRoles}
        canRemoveMembers={canRemoveMembers}
        isSelf={drawerMember?.userId === user?.id}
        isLastAdmin={adminCount <= 1 && drawerMember?.rolePriority === 0}
      />

      <DirectoryBulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        allMembers={filteredMembers}
        memberTeamsMap={memberTeamsMap}
        memberTasksMap={memberTasksMap}
        roles={roles}
        onBulkUpdateRole={handleBulkUpdateRole}
        onBulkRemove={handleBulkRemove}
        canManageRoles={canManageRoles}
        canRemoveMembers={canRemoveMembers}
        currentUserId={user?.id}
      />

      <InviteMemberModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} orgId={orgId} />
      {confirmDialog}
    </PageShell>
  );
}

function DirectorySkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <div className="h-10 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 px-4 border-b border-[var(--border-subtle)] flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}