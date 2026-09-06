import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/cn';
import { SidebarNavItem, ICONS } from '@/shared/ui/SidebarNavItem';
import { useAuth } from '@/identity';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';
import { usePermissions } from '@/identity';
import { useCrews } from '@/crew';
import { useOrgTeams } from '@/organization';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/Avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/Popover';
import { Separator } from '@/shared/ui/Separator';
import { useHelpCenterStore } from '@/onboarding';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchNotes } from '@/note';
import { prefetchDashboardStats } from '@/analytics';
import { prefetchCalendarEvents } from '@/calendar';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import {
  LayoutDashboard, Inbox, CheckSquare, FolderClosed, Zap,
  Calendar, Pencil, BarChart2, Bookmark, Users, Building2,
  Network, Clock, Megaphone, Shield, ShieldAlert, Settings,
  Rocket, Compass, Target, Scale, ChevronLeft,
  Search, Plus, LogOut, User,
  Star, Github , ChevronRight, CircleHelp
} from 'lucide-react';

/*  "  "  "  Icon map   " Linear-style stroke-consistent icon set (1.5px)  "  "  "  */

/*  "  "  "  SidebarNavItem   " extracted from the 5x repeated pattern  "  "  "  */

//  "  "  Workspace Switcher Dropdown  "  " 
function WorkspaceSwitcher({ isExpanded, workspaceMode, setWorkspaceMode, activeOrganization, setActiveOrganization, organizations = [], navigate }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center rounded-xl transition-all duration-200 text-[var(--text-primary)] shrink-0 hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
            isExpanded ? "w-full px-2.5 py-2 gap-2.5 mb-1" : "w-10 h-10 justify-center mb-1"
          )}
        >
          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", workspaceMode === 'CREWS' ? 'bg-purple-500/20 text-purple-400' : workspaceMode === 'ORG' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400')}>
            {workspaceMode === 'CREWS' ? <Rocket size={14} strokeWidth={1.5} /> : workspaceMode === 'ORG' ? <Building2 size={14} strokeWidth={1.5} /> : <User size={14} strokeWidth={1.5} />}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[12px] font-semibold truncate">
                {workspaceMode === 'ORG' ? (activeOrganization?.name || 'Org') : workspaceMode === 'CREWS' ? 'Crews' : 'Personal'}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Switch workspace</div>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-52 p-1.5 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl shadow-2xl">
        <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Workspace</div>
        {['PERSONAL', ...organizations.map(o => ({ type: 'ORG', org: o })), ...(organizations.length === 0 ? ['CREATE_ORG'] : []), 'CREWS'].map((item, i, arr) => {
          const isPersonal = item === 'PERSONAL';
          const isCrew = item === 'CREWS';
          const isCreateOrg = item === 'CREATE_ORG';
          const isActive = isPersonal ? workspaceMode === 'PERSONAL' : isCrew ? workspaceMode === 'CREWS' : workspaceMode === 'ORG' && activeOrganization?.id === item.org?.id;

          let label = item.org?.name;
          if (isPersonal) label = 'Personal Space';
          else if (isCrew) label = 'Crews Hub';
          else if (isCreateOrg) label = 'Organization Workspace';

          let icon = <Building2 size={14} />;
          if (isPersonal) icon = <User size={14} />;
          else if (isCrew) icon = <Rocket size={14} />;
          else if (isCreateOrg) icon = <Plus size={14} className="text-emerald-500" />;

          return (
            <React.Fragment key={isPersonal ? 'personal' : isCrew ? 'crews' : isCreateOrg ? 'create_org' : item.org?.id}>
              {/* Uniform divider between top-level sections: Personal | Orgs | Crews */}
              {(i === 1 || isCrew) && (
                <div className="my-1 border-t border-[var(--border-subtle)]" />
              )}
              <button
                onClick={() => {
                  if (isPersonal) { setWorkspaceMode('PERSONAL'); navigate('/app'); }
                  else if (isCrew) { setWorkspaceMode('CREWS'); navigate('/app'); }
                  else if (isCreateOrg) { navigate('/app/organizations'); }
                  else { setWorkspaceMode('ORG'); setActiveOrganization(item.org); navigate('/app'); }
                }}
                className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors text-left",
                  isActive ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

//  "  "  User Menu  "  " 
function UserMenu({ user, logout, isExpanded }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button data-tour="sidebar-profile" className={cn(
          "flex items-center transition-all duration-200 hover:bg-[var(--bg-hover)] rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          isExpanded ? "w-full px-2.5 py-2 gap-2.5 mb-1" : "w-10 h-10 justify-center mb-1"
        )}>
          <Avatar size="sm" className="w-6 h-6 shrink-0 ring-1 ring-[var(--border-subtle)]">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-[var(--accent)] text-[var(--text-on-accent)] text-[10px] font-bold">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[12px] font-semibold truncate text-[var(--text-primary)]">{user?.name || user?.username}</div>
              <div className="text-[10px] text-[var(--text-tertiary)] truncate">{user?.email}</div>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-48 p-1.5 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl shadow-2xl">
        {!isExpanded && (
          <div className="px-3 py-2">
            <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{user?.name || user?.username}</div>
            <div className="text-[11px] text-[var(--text-tertiary)] truncate">{user?.email}</div>
          </div>
        )}
        <Link to="/app/settings/profile" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
          <User size={14} strokeWidth={1.5} />
          Profile
        </Link>
        <Link to="/app/settings/security" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
          <Settings size={14} strokeWidth={1.5} />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => useHelpCenterStore.getState().open()}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <CircleHelp size={14} strokeWidth={1.5} />
          Help
        </button>
        <div className="my-1 border-t border-[var(--border-subtle)]" />
        <button onClick={() => logout()} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors">
          <LogOut size={14} strokeWidth={1.5} />
          Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}

/*  "  "  "  Section divider  "  "  "  */
function SectionDivider({ isExpanded, label }) {
  if (!isExpanded) return <div className="w-6 h-px bg-[var(--border-subtle)] my-2" />;
  return (
    <div className="flex items-center gap-2 px-2.5 py-2">
      {label && <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>}
      <span className="flex-1 h-px bg-[var(--border-subtle)]" />
    </div>
  );
}

/* === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === 
 * AppSidebar   " Clean, Linear-style navigation
 * === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === === ===  */
export function AppSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { workspaceMode, setWorkspaceMode, activeOrganization, setActiveOrganization, organizations } = useWorkspace();
  const { isSuperAdmin } = usePermissions();
  const { data: crewsData } = useCrews();
  const crews = crewsData || [];
  const { data: teamsData = [] } = useOrgTeams(activeOrganization?.id);
  const teams = teamsData || [];
  const location = useLocation();
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(() => localStorage.getItem('ryokai_sidebar_expanded') !== 'false');

  const toggleSidebar = () => {
    setIsExpanded(prev => { const n = !prev; localStorage.setItem('ryokai_sidebar_expanded', String(n)); return n; });
  };

  const isSettings = location.pathname.startsWith('/app/settings');
  const inCrew = location.pathname.startsWith('/app/crews/') && location.pathname !== '/app/crews';
  const qc = useQueryClient();

  const handlePrefetch = (to) => {
    if (to === '/app/notes') {
      const noteScope = workspaceMode === 'ORG' && activeOrganization?.id
        ? { orgId: activeOrganization.id }
        : workspaceMode === 'CREWS' && activeCrew?.id
        ? { crewId: activeCrew.id }
        : {};
      prefetchNotes(qc, noteScope);
      import('@/note/pages/NotesPage');
    } else if (to === '/app/analytics') {
      const statsParams = workspaceMode === 'ORG'
        ? { scope: 'ORG', orgId: activeOrganization?.id }
        : workspaceMode === 'CREWS'
        ? { scope: 'CREWS', crewId: activeCrew?.id }
        : { scope: 'PERSONAL' };
      prefetchDashboardStats(qc, statsParams);
      import('@/analytics/pages/AnalyticsPage');
    } else if (to === '/app/calendar') {
      const calScope = workspaceMode === 'ORG' && activeOrganization?.id
        ? { orgId: activeOrganization.id }
        : workspaceMode === 'CREWS' && activeCrew?.id
        ? { crewId: activeCrew.id }
        : {};
      const now = new Date();
      const start = startOfWeek(startOfMonth(now)).toISOString();
      const end = endOfWeek(endOfMonth(now)).toISOString();
      prefetchCalendarEvents(qc, start, end, calScope);
      import('@/calendar/pages/CalendarPage');
    }
  };

  // Navigation sections
  const workspaceNav = {
    PERSONAL: [
      { to: '/app', icon: ICONS.dashboard, label: 'Home', end: true },
      { to: '/app/inbox', icon: ICONS.inbox, label: 'Notifications' },
      { to: '/app/tasks', icon: ICONS.tasks, label: 'My Tasks' },
      { to: '/app/projects', icon: ICONS.projects, label: 'Projects' },
      { to: '/app/github', icon: ICONS.github, label: 'GitHub', section: 'Code' },
      { to: '/app/focus', icon: ICONS.focus, label: 'Focus' },
    ],
    CREWS: [
      { to: '/app', icon: ICONS.dashboard, label: 'Home', end: true },
      { to: '/app/inbox', icon: ICONS.inbox, label: 'Inbox' },
      { to: '/app/crews', icon: ICONS.crews, label: 'My Crews', end: true },
      { to: '/app/crews/discover', icon: ICONS.discover, label: 'Discover' },
      { to: '/app/projects', icon: ICONS.projects, label: 'Projects' }
    ],
    ORG: [
      { to: '/app', icon: ICONS.dashboard, label: 'Home', end: true },
      { to: '/app/inbox', icon: ICONS.inbox, label: 'Inbox' },
      { to: '/app/tasks', icon: ICONS.tasks, label: 'Tasks' },
      { to: '/app/projects', icon: ICONS.projects, label: 'Projects' },
      { to: '/app/teams', icon: ICONS.teams, label: 'Teams' },
      { to: '/app/directory', icon: ICONS.directory, label: 'Directory' },
    ],
  };

  const toolsNav = {
    PERSONAL: [
      { to: '/app/calendar', icon: ICONS.calendar, label: 'Calendar' },
      { to: '/app/notes', icon: ICONS.notes, label: 'Notes' },
      { to: '/app/analytics', icon: ICONS.analytics, label: 'Analytics' },
      { to: '/app/saved', icon: ICONS.saved, label: 'Saved' },
    ],
    CREWS: [
      { to: '/app/calendar', icon: ICONS.calendar, label: 'Calendar' },
      { to: '/app/notes', icon: ICONS.notes, label: 'Notes' },
      { to: '/app/analytics', icon: ICONS.analytics, label: 'Analytics' },
    ],
    ORG: [
      { to: '/app/calendar', icon: ICONS.calendar, label: 'Calendar' },
      { to: '/app/notes', icon: ICONS.notes, label: 'Notes' },
      { to: '/app/goals', icon: ICONS.goals, label: 'Goals' },
      { to: '/app/workload', icon: ICONS.workload, label: 'Workload' },
      { to: '/app/leave-requests', icon: ICONS.leave, label: 'Leaves' },
      { to: '/app/announcements', icon: ICONS.announcements, label: 'Announce' },
    ],
  };

  const adminNav = (isSuperAdmin || workspaceMode === 'ORG') ? [
    workspaceMode === 'ORG' && { to: '/app/roles-permissions', icon: ICONS.roles, label: 'Roles' },
    workspaceMode === 'ORG' && { to: '/app/organizations', icon: ICONS.org, label: 'Org Admin' },
    isSuperAdmin && { to: '/platform', icon: ICONS.admin, label: 'Platform' },
  ].filter(Boolean) : [];

  const sidebar = (
    <div className={cn(
      "flex flex-col h-full bg-[var(--bg-base)]/80 backdrop-blur-xl relative z-20 border-r border-[var(--border-subtle)] transition-[width] duration-250 ease-out",
      isExpanded ? "w-[240px] px-2" : "w-[56px] items-center px-1"
    )}>
      {/* User Menu */}
      <div className={cn("pt-3", isExpanded ? "" : "flex justify-center")}>
        <UserMenu user={user} logout={logout} isExpanded={isExpanded} />
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher isExpanded={isExpanded} workspaceMode={workspaceMode} setWorkspaceMode={setWorkspaceMode} activeOrganization={activeOrganization} setActiveOrganization={setActiveOrganization} organizations={organizations} navigate={navigate} />

      {/* Command Palette trigger */}
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          isExpanded ? "w-full px-2.5 py-2 gap-2.5 mb-1" : "w-10 h-10 justify-center mb-1"
        )}
      >
        <Search size={16} strokeWidth={1.5} />
        {isExpanded && (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-tertiary)]">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center rounded-md bg-[var(--bg-subtle)] px-1.5 font-mono text-[10px] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">Cmd+K</kbd>
          </div>
        )}
      </button>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-2" data-tour="sidebar-nav">
        {isSettings ? (
          <>
            <SidebarNavItem to="/app" icon={ICONS.back} label="Back to Workspace" isExpanded={isExpanded} onClick={() => navigate('/app')} />
            <SectionDivider isExpanded={isExpanded} label="Settings" />
            <SidebarNavItem to="/app/settings/profile" icon={ICONS.dashboard} label="Profile" isExpanded={isExpanded} />
            <SidebarNavItem to="/app/settings/security" icon={ICONS.roles} label="Security" isExpanded={isExpanded} />
            <SidebarNavItem to="/app/settings/sessions" icon={ICONS.settings} label="Sessions" isExpanded={isExpanded} />
          </>
        ) : (
          <>
            {/* Workspace navigation */}
            <SectionDivider isExpanded={isExpanded} label={workspaceMode === 'CREWS' ? 'Crews' : workspaceMode === 'ORG' ? 'Workspace' : undefined} />
            {(workspaceNav[workspaceMode] || workspaceNav.PERSONAL).map(item => (
              <React.Fragment key={item.to}>
                {item.section && <SectionDivider isExpanded={isExpanded} label={item.section} />}
                <SidebarNavItem
                  {...item}
                  isExpanded={isExpanded}
                  onMouseEnter={() => handlePrefetch(item.to)}
                  onFocus={() => handlePrefetch(item.to)}
                />
              </React.Fragment>
            ))}

            {/* Dynamic Teams (ORG Mode) */}
            {workspaceMode === 'ORG' && activeOrganization && teams.length > 0 && (
              <>
                <SectionDivider isExpanded={isExpanded} label={isExpanded ? 'Your Teams' : undefined} />
                {teams.map(team => (
                  <SidebarNavItem
                    key={team.id}
                    to={`/app/organizations/${activeOrganization.id}/teams/${team.id}`}
                    label={team.name}
                    avatarLetter={team.name?.charAt(0).toUpperCase()}
                    isExpanded={isExpanded}
                  />
                ))}
              </>
            )}

            {/* Dynamic Crews (CREWS Mode) */}
            {workspaceMode === 'CREWS' && crews.length > 0 && (
              <>
                <SectionDivider isExpanded={isExpanded} label={isExpanded ? 'Your Crews' : undefined} />
                {crews.map(crew => (
                  <SidebarNavItem
                    key={crew.id}
                    to={`/app/crews/${crew.id}`}
                    label={crew.name}
                    avatarLetter={crew.name?.charAt(0).toUpperCase()}
                    isExpanded={isExpanded}
                  />
                ))}
              </>
            )}

            {/* Tools */}
            <SectionDivider isExpanded={isExpanded} label={isExpanded ? 'Tools' : undefined} />
            {(toolsNav[workspaceMode] || toolsNav.PERSONAL).map(item => (
              <SidebarNavItem
                key={item.to}
                {...item}
                isExpanded={isExpanded}
                onMouseEnter={() => handlePrefetch(item.to)}
                onFocus={() => handlePrefetch(item.to)}
              />
            ))}

            {/* Admin section */}
            {adminNav.length > 0 && (
              <>
                <SectionDivider isExpanded={isExpanded} label={isExpanded ? 'Admin' : undefined} />
                {adminNav.map((item, i) => item && <SidebarNavItem key={i} {...item} isExpanded={isExpanded} />)}
              </>
            )}
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <div className={cn("pb-3 pt-1 border-t border-[var(--border-subtle)]", isExpanded ? "px-2" : "flex justify-center")}>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block h-full shrink-0">{sidebar}</div>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-y-0 left-0 h-full bg-[var(--bg-base)]/90 backdrop-blur-xl shadow-2xl rounded-r-2xl overflow-hidden">
              <div className={cn("flex flex-col h-full", "w-[240px] px-2")}>
                <div className="p-3 flex items-center justify-between">
                  <UserMenu user={user} logout={logout} isExpanded />
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"><ChevronLeft size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-0.5">
                  {(workspaceNav[workspaceMode] || workspaceNav.PERSONAL).map(item => (
                    <React.Fragment key={item.to}>
                      {item.section && <SectionDivider isExpanded label={item.section} />}
                      <SidebarNavItem {...item} isExpanded onClick={onClose} />
                    </React.Fragment>
                  ))}

                  {workspaceMode === 'ORG' && activeOrganization && teams.length > 0 && (
                    <>
                      <SectionDivider isExpanded label="Your Teams" />
                      {teams.map(team => (
                        <SidebarNavItem
                          key={team.id}
                          to={`/app/organizations/${activeOrganization.id}/teams/${team.id}`}
                          label={team.name}
                          avatarLetter={team.name?.charAt(0).toUpperCase()}
                          isExpanded
                          onClick={onClose}
                        />
                      ))}
                    </>
                  )}

                  {workspaceMode === 'CREWS' && crews.length > 0 && (
                    <>
                      <SectionDivider isExpanded label="Your Crews" />
                      {crews.map(crew => (
                        <SidebarNavItem
                          key={crew.id}
                          to={`/app/crews/${crew.id}`}
                          label={crew.name}
                          avatarLetter={crew.name?.charAt(0).toUpperCase()}
                          isExpanded
                          onClick={onClose}
                        />
                      ))}
                    </>
                  )}

                  <SectionDivider isExpanded label="Tools" />
                  {(toolsNav[workspaceMode] || toolsNav.PERSONAL).map(item => (
                    <SidebarNavItem key={item.to} {...item} isExpanded onClick={onClose} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

