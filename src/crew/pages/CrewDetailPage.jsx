import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heading, Text } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Icons } from '@/shared/ui/Icons';
import { TasksTab } from '../components/CrewDetailTabs/TasksTab';
import { ChannelsTab } from '../components/CrewDetailTabs/ChannelsTab';
import { ProjectsTab } from '../components/CrewDetailTabs/ProjectsTab';
import { MembersTab } from '../components/CrewDetailTabs/MembersTab';
import { WhiteboardsTab } from '../components/CrewDetailTabs/WhiteboardsTab';
import { OverviewTab } from '../components/CrewDetailTabs/OverviewTab';
import { CrewTabs } from '../components/CrewTabs';
import { useTaskList } from '@/task';
import { useProjects } from '@/project';
import { useCrew, useCrewMembers, useCrewChannels, useCrewProjects, useLeaveCrew, useDeleteCrew } from '../features/hooks/useCrews';
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog/ConfirmDialog';
import { PageShell } from '@/shared/ui/PageShell';
import { PageState } from '@/shared/ui/PageState';
import { useAuth } from '@/identity';
import { SaveToggle } from '@/saved/features/components/SaveToggle';
import { ENTITY_TYPES } from '@/shared/constants/entityTypes';
import { CrewStatusPill } from '@/shared/ui/CrewStatusPill';
import { cn } from '@/shared/lib/cn';
import { SPRINGS } from '@/shared/lib/uxTokens';
import { toast } from 'sonner';
import { Skeleton } from '@/shared/ui/Skeleton';
import { DropdownMenu } from '@/shared/ui/DropdownMenu';
import { EditCrewModal } from '../components/EditCrewModal';

const CREW_TABS = ['overview', 'tasks', 'channels', 'projects', 'whiteboards', 'members']

function hashHue(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % 360
}

/* Activity Feed Item */
function ActivityItem({ type, user, action, target, time, hue }) {
  const iconMap = {
    project_shared: Icons.folderPlus,
    task_created: Icons.plusCircle,
    task_completed: Icons.checkCircle2,
  }
  const Icon = iconMap[type] || Icons.activity

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2.5 py-2.5"
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white"
        style={{ background: `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${(hue + 35) % 360} 68% 38%))` }}
      >
        <Icon className="w-3 h-3" />
      </span>
      <div className="min-w-0 flex-1">
        <Text size="xs" className="text-[var(--text-secondary)] leading-snug">
          <span className="font-semibold text-[var(--text-primary)]">{user}</span>{' '}
          {action}{' '}
          {target && <span className="font-medium text-[var(--accent)]">{target}</span>}
        </Text>
        <Text size="xs" className="text-[var(--text-muted)]">{time}</Text>
      </div>
    </motion.div>
  )
}

/* Quick Jump FAB */
function QuickJumpFab({ visible }) {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 16 }}
          transition={SPRINGS.fast}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-lg shadow-black/5 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] hover:shadow-xl transition-all duration-200"
          title="Scroll to top"
        >
          <Icons.chevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export function CrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(initialTab && CREW_TABS.includes(initialTab) ? initialTab : 'overview');
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFab, setShowFab] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const sentinelRef = useRef(null);

  const { data: crew, isLoading: isCrewLoading } = useCrew(crewId);
  const { data: members = [] } = useCrewMembers(crewId);

  const { data: { tasks: rawCrewTasks = [] } = {} } = useTaskList({ crewId });

  const isCreator = useMemo(() => {
    if (!crew) return false;
    if (crew.myRole === 'CREATOR' || crew.myRole === 'OWNER') return true;
    if (!user) return false;
    const myMembership = members.find(m => m.userId === user.id || m.username === user.username);
    return myMembership?.role === 'CREATOR' || myMembership?.role === 'OWNER';
  }, [crew, members, user]);

  const deleteCrewMutation = useDeleteCrew();
  const leaveCrewMutation = useLeaveCrew();

  const handleLeaveCrew = async () => {
    if (isCreator) {
      if (members.length > 1) {
        const wantsTransfer = await confirm({
          title: 'Owner Action Required',
          description: `As the owner of ${crew?.name || 'this crew'}, you cannot leave while other members remain. Would you like to transfer ownership to another member?`,
          confirmLabel: 'Transfer Ownership',
          cancelLabel: 'Delete Crew Instead',
          danger: false,
        });

        if (wantsTransfer) {
          setActiveTab('members');
          toast.info('Please select a member and click Transfer Ownership before leaving.');
          return;
        }

        const confirmDelete = await confirm({
          title: 'Delete Crew Permanently?',
          description: `This will permanently delete ${crew?.name || 'this crew'} and remove all channels, tasks, and member access. This action cannot be undone.`,
          confirmLabel: 'Delete Crew',
          cancelLabel: 'Cancel',
          danger: true,
        });

        if (confirmDelete) {
          deleteCrewMutation.mutate(crewId, {
            onSuccess: () => {
              toast.success(`${crew?.name || 'Crew'} deleted successfully.`);
              navigate('/app/crews');
            },
            onError: (err) => {
              toast.error(err?.response?.data?.message || 'Failed to delete crew.');
            }
          });
        }
        return;
      } else {
        const confirmDelete = await confirm({
          title: 'Delete Crew & Leave?',
          description: `As the sole member of ${crew?.name || 'this crew'}, leaving will permanently delete it. Do you want to delete this crew?`,
          confirmLabel: 'Delete Crew',
          cancelLabel: 'Cancel',
          danger: true,
        });

        if (confirmDelete) {
          deleteCrewMutation.mutate(crewId, {
            onSuccess: () => {
              toast.success(`${crew?.name || 'Crew'} deleted.`);
              navigate('/app/crews');
            },
            onError: (err) => {
              toast.error(err?.response?.data?.message || 'Failed to delete crew.');
            }
          });
        }
        return;
      }
    }

    const confirmed = await confirm({
      title: 'Leave Crew?',
      description: `Are you sure you want to exit ${crew?.name || 'this crew'}?`,
      confirmLabel: 'Leave Crew',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!confirmed) return;

    leaveCrewMutation.mutate(crewId, {
      onSuccess: () => {
        toast.success(`You have left ${crew?.name || 'the crew'}.`);
        navigate('/app/crews');
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || err?.message || 'Failed to leave crew.');
      }
    });
  };

  // Backend already scopes to this crew including tasks of projects shared
  // with / owned by the crew (project bridge), so pass through as-is.
  const crewTasks = useMemo(() => (Array.isArray(rawCrewTasks) ? rawCrewTasks : []), [rawCrewTasks]);

  const { data: sharedProjects = [] } = useCrewProjects(crewId);
  const { data: allProjects = [] } = useProjects();
  const { data: channels = [] } = useCrewChannels(crewId);

  const completionRate = useMemo(() => {
    if (crewTasks.length === 0) return 0;
    const done = crewTasks.filter(t => t.status === 'Done' || t.status === 'COMPLETED').length;
    return Math.round((done / crewTasks.length) * 100);
  }, [crewTasks]);

  const tabCounts = useMemo(() => ({
    tasks: crewTasks.length,
    channels: channels.length,
    projects: sharedProjects.length,
    members: members.length,
  }), [crewTasks.length, channels.length, sharedProjects.length, members.length]);

  // Sticky header observer
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsHeaderSticky(!entry.isIntersecting),
      { threshold: 1.0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Scroll listener for FAB visibility
  useEffect(() => {
    const onScroll = () => {
      setShowFab(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Activity feed derived from live crew data (same pattern as team HQ)
  const activityFeed = useMemo(() => {
    const items = []
    crewTasks.forEach(t => {
      if (t.createdAt) {
        items.push({
          type: 'task_created',
          user: t.creatorName || t.createdBy || 'Someone',
          action: 'created task',
          target: t.title || 'a task',
          time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }
      if (t.updatedAt && (t.status === 'Done' || t.status === 'COMPLETED')) {
        items.push({
          type: 'task_completed',
          user: t.assignedTo || 'Someone',
          action: 'completed',
          target: t.title || 'a task',
          time: new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }
    })
    sharedProjects.slice(-3).reverse().forEach(p => {
      items.push({
        type: 'project_shared',
        user: p.creator || p.createdBy || 'Someone',
        action: 'shared project',
        target: p.name || 'Untitled',
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently',
      })
    })
    return items.slice(0, 20)
  }, [crewTasks, sharedProjects])

  const pageState = isCrewLoading ? 'loading' : !crew ? 'empty' : 'ready';
  const hue = crew?.hue !== undefined ? crew.hue : hashHue(crew?.name || 'Crew')

  return (
    <PageShell maxWidth="full" className="!px-0 !py-0">
      <PageState
        state={pageState}
        stateProps={{skeleton: <CrewDetailSkeleton />, 
          loadingVariant: 'cards',
          onRetry: () => navigate(0),
          empty: {
            icon: Icons.users,
            title: 'Crew Not Found',
            description: 'The requested crew does not exist or you do not have permission to view it.',
          },
        }}
      >
        {crew && (
          <div className="flex flex-col h-full">
            {/* Sentinel for sticky detection */}
            <div ref={sentinelRef} className="h-px" />

            {/* Sticky Header -- identity + actions only (rich stats live in Overview) */}
            <div
              className={cn(
                'sticky top-0 z-30 transition-shadow duration-200',
                isHeaderSticky
                  ? 'bg-[var(--bg-base)] border-b border-[var(--border-subtle)] shadow-sm'
                  : 'bg-[var(--bg-base)]',
              )}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={cn('flex items-center gap-3 transition-all duration-200', isHeaderSticky ? 'py-2' : 'py-3')}>
                  {/* Back */}
                  <button
                    onClick={() => navigate('/app/crews')}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
                    title="Back to crews"
                  >
                    <Icons.chevronLeft className="w-4 h-4" />
                  </button>

                  {/* Avatar */}
                  <div
                    className={cn(
                      'rounded-lg flex items-center justify-center font-bold text-white shrink-0 border border-white/10 transition-all',
                      isHeaderSticky ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs',
                    )}
                    style={{ background: `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${(hue + 35) % 360} 68% 38%))` }}
                  >
                    {crew.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + badges */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Heading level={3} className={cn('font-semibold truncate mb-0 transition-all', isHeaderSticky ? 'text-[13px]' : 'text-[14px]')}>
                      {crew.name}
                    </Heading>
                    {crew.visibility && (
                      <Badge variant="outline" className="hidden sm:inline-flex text-[9px] uppercase font-mono shrink-0">
                        {String(crew.visibility).replace('_', ' ')}
                      </Badge>
                    )}
                    {!isHeaderSticky && crew.description && (
                      <Text variant="muted" size="xs" className="line-clamp-1 ml-1 hidden md:inline">{crew.description}</Text>
                    )}
                    {!isHeaderSticky && (
                      <div className="hidden lg:block">
                        <CrewStatusPill completionRate={completionRate} crewTasks={crewTasks} members={members} size="sm" />
                      </div>
                    )}
                    <SaveToggle entityType={ENTITY_TYPES?.CREW || 'crew'} entityId={crew.id} className="ml-auto sm:ml-1" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="primary" size="sm" onClick={() => setActiveTab('tasks')} className="gap-1 text-[11px] h-7 shadow-sm">
                      <Icons.plus className="w-3 h-3" /> Add Task
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('whiteboards')} className="gap-1 text-[11px] h-7 hidden sm:inline-flex">
                      <Icons.pencil className="w-3 h-3" /> New Board
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLeaveCrew} className="gap-1 text-[11px] h-7 hidden sm:inline-flex text-[var(--danger)] hover:text-[var(--danger)]">
                      <Icons.logout className="w-3 h-3" /> Leave
                    </Button>
                    <DropdownMenu
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          title="Crew settings and actions"
                          aria-label="Crew settings and actions"
                        >
                          <Icons.moreVertical className="w-3.5 h-3.5" />
                        </Button>
                      }
                      items={[
                        ...(isCreator ? [
                          {
                            label: 'Edit Crew',
                            icon: Icons.pencil,
                            onClick: () => setIsEditModalOpen(true),
                          }
                        ] : []),
                        {
                          label: isCreator && members.length <= 1 ? 'Delete Crew' : 'Leave Crew',
                          icon: Icons.logout,
                          onClick: handleLeaveCrew,
                          danger: true,
                          separator: isCreator ? 'before' : undefined,
                        },
                      ]}
                    />
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                      className={cn('gap-1 text-[11px] h-7 px-2 hidden lg:inline-flex', showSidebar && 'text-[var(--accent)] bg-[var(--accent-soft)]')}
                      title="Activity feed"
                    >
                      <Icons.activity className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area (with optional activity sidebar) */}
            <div className="flex-1 min-h-0 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
              <div className="mt-5 mb-2">
                <CrewTabs activeTab={activeTab} setActiveTab={setActiveTab} tabCounts={tabCounts} sticky={false} />
              </div>
              <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-0">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      {activeTab === 'overview' && (
                        <div className="pt-4">
                          <OverviewTab
                            crew={crew}
                            members={members}
                            sharedProjects={sharedProjects}
                            crewTasks={crewTasks}
                            channels={channels}
                            completionRate={completionRate}
                            setActiveTab={setActiveTab}
                            isCreator={isCreator}
                          />
                        </div>
                      )}
                      {activeTab === 'tasks' && (
                        <div className="pt-4">
                          <TasksTab crewId={crewId} tasks={crewTasks} />
                        </div>
                      )}
                      {activeTab === 'channels' && (
                        <div className="pt-4">
                          <ChannelsTab crewId={crewId} channels={channels} isCreator={isCreator} />
                        </div>
                      )}
                      {activeTab === 'projects' && (
                        <div className="pt-4">
                          <ProjectsTab crewId={crewId} sharedProjects={sharedProjects} allProjects={allProjects} isCreator={isCreator} />
                        </div>
                      )}
                      {activeTab === 'whiteboards' && (
                        <div className="pt-4">
                          <WhiteboardsTab crewId={crewId} isCreator={isCreator} />
                        </div>
                      )}
                      {activeTab === 'members' && (
                        <div className="pt-4">
                          <MembersTab crewId={crewId} members={members} memberCap={crew?.memberCap} isCreator={isCreator} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Sidebar: Activity Feed -- floating overlay, does not steal content width */}
                <AnimatePresence>
                  {showSidebar && (
                    <motion.aside
                      initial={{ x: 320, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 320, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="hidden lg:block absolute right-0 top-0 bottom-0 z-30 w-[300px] bg-[var(--bg-card)] border-l border-[var(--border-subtle)] shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-y-auto scrollbar-thin"
                    >
                      <div className="pl-5 pr-3 pt-3 pb-4">
                        <div className="flex items-center justify-between mb-3 sticky top-0 bg-[var(--bg-card)] z-10 pb-2">
                          <div className="flex items-center gap-1.5">
                            <Icons.activity className="w-4 h-4 text-[var(--accent)]" />
                            <Heading level={4} className="text-[12px] font-semibold tracking-tight mb-0">
                              Activity Feed
                            </Heading>
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {activityFeed.length}
                          </Badge>
                        </div>

                        {activityFeed.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Icons.activity className="w-8 h-8 text-[var(--text-muted)] mb-3 opacity-40" />
                            <Text size="xs" className="text-[var(--text-muted)]">
                              No recent activity
                            </Text>
                            <Text size="xs" className="text-[var(--text-muted)] mt-0.5">
                              Actions will appear here
                            </Text>
                          </div>
                        ) : (
                          <div className="divide-y divide-[var(--border-subtle)]">
                            {activityFeed.map((item, i) => (
                              <ActivityItem
                                key={`${item.type}-${i}`}
                                type={item.type}
                                user={item.user}
                                action={item.action}
                                target={item.target}
                                time={item.time}
                                hue={(hue + i * 20) % 360}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </PageState>

      {confirmDialog}

      {crew && (
        <EditCrewModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          crew={crew}
          membersCount={members.length}
        />
      )}

      {/* Quick Jump FAB */}
      <QuickJumpFab visible={showFab} />
    </PageShell>
  );
}

function CrewDetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3.5 flex-wrap">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1.5 flex-1 min-w-0"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="flex items-center gap-2 pb-2.5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-lg" />)}
          </div>
        </div>
      </div>
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <Skeleton className="h-[340px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
