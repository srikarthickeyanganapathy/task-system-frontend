import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heading, Text } from '@/shared/ui/Typography';
import { Button, IconButton } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { InteractiveCard } from '@/shared/ui/InteractiveCard';
import { Input } from '@/shared/ui/Input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/shared/ui/Modal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/Select';
import { ErrorState } from '@/shared/ui/ErrorState';
import { ImmersiveEmptyState } from '@/shared/ui/Immersive';
import { useShareProjectWithCrew, useUnshareProjectFromCrew } from '@/crew';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowRight,
  ArrowUpRight,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  Plus,
  LayoutGrid,
  GanttChart,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Clock,
  Check,
  Loader2,
} from '@/shared/ui/Icons';
import { cn } from '@/shared/lib/cn';

// Health Radar derivation logic
function getHealthInfo(project) {
  const completion = project.completion ?? project.progress ?? 0;
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && completion < 100;

  if (project.health === 'Delayed' || project.health === 'Critical' || isOverdue) {
    return {
      status: 'Delayed',
      label: 'Delayed',
      badgeVariant: 'danger',
      indicatorBg: 'bg-[var(--danger-soft)]',
      indicatorText: 'text-[var(--danger)]',
      dotColor: 'bg-[var(--danger)]',
      Icon: ShieldAlert,
    };
  }

  if (project.health === 'At Risk' || (completion > 0 && completion < 40)) {
    return {
      status: 'At Risk',
      label: 'At Risk',
      badgeVariant: 'warning',
      indicatorBg: 'bg-[var(--warning-soft)]',
      indicatorText: 'text-[#B45309] dark:text-[var(--warning)]',
      dotColor: 'bg-[var(--warning)]',
      Icon: AlertTriangle,
    };
  }

  if (project.health === 'Planning' || (completion === 0 && !project.status)) {
    return {
      status: 'Planning',
      label: 'Planning',
      badgeVariant: 'outline',
      indicatorBg: 'bg-[var(--bg-subtle)]',
      indicatorText: 'text-[var(--text-muted)]',
      dotColor: 'bg-[var(--text-muted)]',
      Icon: Clock,
    };
  }

  return {
    status: 'On Track',
    label: 'On Track',
    badgeVariant: 'success',
    indicatorBg: 'bg-[var(--success-soft)]',
    indicatorText: 'text-[var(--success)]',
    dotColor: 'bg-emerald-500',
    Icon: CheckCircle2,
  };
}

// Team-style health score utilities (mirrors @/project/features/utils/projectUtils --
// inlined here to respect the domain barrel boundary)
function calculateHealthScore(project) {
  if (!project) return 100;
  if (project.status === 'COMPLETED' || Number(project.progress) >= 100) return 100;
  let score = 80;
  const progress = Number(project.progress) || 0;
  const tasksTotal = Number(project.tasksTotal) || 0;
  const tasksCompleted = Number(project.tasksCompleted) || 0;
  if (tasksTotal > 0 && tasksCompleted / tasksTotal >= progress / 100) score += 5;
  if (project.dueDate) {
    const dueDate = new Date(project.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) score -= 35;
    else if (diffDays <= 3 && progress < 80) score -= 20;
    else if (diffDays <= 7 && progress < 50) score -= 10;
  }
  if (project.status === 'OFF_TRACK') score -= 25;
  if (project.status === 'AT_RISK') score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}
function getHealthStatus(score) {
  if (score >= 85) return { label: 'Excellent', tone: 'success' };
  if (score >= 70) return { label: 'Healthy', tone: 'accent' };
  if (score >= 50) return { label: 'At Risk', tone: 'warning' };
  return { label: 'Critical', tone: 'danger' };
}
function formatRelativeDate(isoString) {
  if (!isoString) return 'No due date';
  const dueDate = new Date(isoString);
  const now = new Date();
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day(s)`;
  if (diffDays === 0) return 'Due Today';
  if (diffDays === 1) return 'Due Tomorrow';
  if (diffDays <= 7) return `${diffDays} days left`;
  return dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Shimmer Skeleton Loader for State 1
function ProjectsTabSkeleton({ viewMode }) {
  if (viewMode === 'timeline') {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4 animate-pulse">
        <div className="h-8 bg-[var(--bg-subtle)] rounded-lg w-1/4 mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border-subtle)]/50">
            <div className="w-40 space-y-2">
              <div className="h-4 bg-[var(--bg-subtle)] rounded w-3/4" />
              <div className="h-3 bg-[var(--bg-subtle)] rounded w-1/2" />
            </div>
            <div className="flex-1 h-8 bg-[var(--bg-subtle)] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-[var(--bg-subtle)] rounded w-1/3" />
            <div className="h-5 bg-[var(--bg-subtle)] rounded-full w-20" />
          </div>
          <div className="h-6 bg-[var(--bg-subtle)] rounded w-2/3" />
          <div className="h-12 bg-[var(--bg-subtle)] rounded-lg" />
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
            <div className="h-6 w-6 bg-[var(--bg-subtle)] rounded-full" />
            <div className="h-4 bg-[var(--bg-subtle)] rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Project Card Component for Grid View
// Team-look Shared Project Card -- structural clone of @/project/components/ProjectCard.
// Click / arrow open the project workspace (functional); unshare kept only for creators
// (backend DELETE /crew/{id}/projects/{projectId}). Favorites removed: client-only, no persistence.
function SharedProjectCard({ project, index, canUnshare, onRequestUnshare }) {
  const navigate = useNavigate();
  const { id, name, description, progress = 0, tasksTotal = 0, tasksCompleted = 0, dueDate, status } = project;
  const tasksLeft = (tasksTotal || 0) - (tasksCompleted || 0);
  const healthScore = calculateHealthScore(project);
  const health = getHealthStatus(healthScore);
  const formattedDueDate = formatRelativeDate(dueDate);
  const isOverdue = formattedDueDate.includes('Overdue');

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((progress || 0) / 100) * circumference;

  const handleOpen = () => navigate(`/app/projects/${id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="block h-full group"
    >
      <InteractiveCard onClick={handleOpen} className="h-full flex flex-col p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border",
              health.tone === 'success' && 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]',
              health.tone === 'accent' && 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]',
              health.tone === 'warning' && 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]',
              health.tone === 'danger' && 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)]'
            )}>
              {health.label} {healthScore}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={cn('text-[10px]', status === 'COMPLETED' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]')}>{status || 'ACTIVE'}</Badge>
            {canUnshare && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                onClick={(e) => { e.stopPropagation(); onRequestUnshare(project) }}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors shrink-0"
                title="Unshare from Crew"
                aria-label="Unshare from crew"
              >
                <Unlink className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>
        </div>

        <button onClick={handleOpen} className="text-left w-full">
          <Heading level={4} className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors truncate">
            {name}
          </Heading>
        </button>

        <button onClick={handleOpen} className="text-left w-full">
          <Text size="sm" variant="muted" className="text-[12px] leading-relaxed mb-4 line-clamp-2 min-h-[32px]">
            {description || 'No description provided.'}
          </Text>
        </button>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/50">
          <button onClick={handleOpen} className="flex items-center gap-3 text-left">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 transform -rotate-90 absolute inset-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--bg-subtle)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r={radius}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">{progress || 0}%</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">
              <div>{tasksCompleted || 0}/{tasksTotal || 0} Tasks</div>
              <div className="text-[var(--text-tertiary)]">{tasksLeft > 0 ? `${tasksLeft} left` : 'All done'}</div>
            </div>
          </button>

          {dueDate ? (
            <button onClick={handleOpen} className={cn(
              "text-[11px] font-medium px-2 py-1 rounded-md",
              isOverdue ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
            )}>
              {formattedDueDate}
            </button>
          ) : null}

          <button
            onClick={handleOpen}
            className="text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--bg-subtle)]"
            title="Open full project"
          >
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </InteractiveCard>
    </motion.div>
  );
}

// Mini-Gantt Timeline View
function MiniGanttTimelineView({ projects, canUnshare, onRequestUnshare }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();
  const visibleMonths = [
    months[(currentMonthIdx) % 12],
    months[(currentMonthIdx + 1) % 12],
    months[(currentMonthIdx + 2) % 12],
    months[(currentMonthIdx + 3) % 12],
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      {/* Timeline Header */}
      <div className="grid grid-cols-12 gap-2 p-4 bg-[var(--bg-subtle)]/50 border-b border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        <div className="col-span-5 md:col-span-4">Project & Health Radar</div>
        <div className="col-span-7 md:col-span-8 grid grid-cols-4 gap-2 text-center border-l border-[var(--border-subtle)] pl-4">
          {visibleMonths.map((m, idx) => (
            <div key={idx} className="truncate">
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {projects.map((project, index) => {
          const completion = project.completion ?? project.progress ?? 0;
          const healthInfo = getHealthInfo(project);
          const ownerName = project.createdBy || project.ownerName || project.owner?.username || 'Lead';

          // Gantt bar math based on completion or dates
          const barStartPercent = Math.min(index * 15, 40);
          const barWidthPercent = Math.max(30, Math.min(80 - barStartPercent, 60));

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
              className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-[var(--bg-subtle)]/30 transition-colors"
            >
              {/* Project Metadata Column */}
              <div className="col-span-5 md:col-span-4 pr-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", healthInfo.dotColor)} />
                    <Link
                      to={`/app/projects/${project.id}`}
                      className="font-semibold text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] truncate transition-colors"
                    >
                      {project.name}
                    </Link>
                  </div>

                </div>

                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="truncate">Lead: @{ownerName}</span>
                </div>
              </div>

              {/* Gantt Timeline Bar Column */}
              <div className="col-span-7 md:col-span-8 border-l border-[var(--border-subtle)] pl-4 relative py-2">
                <div className="w-full bg-[var(--bg-subtle)] h-7 rounded-lg relative overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="absolute top-0 bottom-0 bg-[var(--accent-soft)] rounded-md border border-[var(--accent-border)] flex items-center px-2 text-[10px] font-semibold text-[var(--accent)] transition-all duration-500"
                    style={{ left: `${barStartPercent}%`, width: `${barWidthPercent}%` }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] opacity-30 rounded-l-md"
                      style={{ width: `${completion}%` }}
                    />
                    <span className="relative z-10 font-mono truncate">
                      {completion}% ({healthInfo.label})
                    </span>
                  </div>
                </div>

                {/* Direct Action Overlay */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[var(--bg-card)]/90 backdrop-blur-xs p-0.5 rounded-md border border-[var(--border-subtle)]">
                  <Link
                    to={`/app/projects/${project.id}`}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)]"
                    title="Open Workspace"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  {canUnshare && (
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => onRequestUnshare(project)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)] h-6 w-6"
                    title="Unshare Project"
                    aria-label="Unshare project"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </IconButton>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Main ProjectsTab -- Crew Shared Projects
export function ProjectsTab({
  crewId,
  isCreator = false,
  sharedProjects = [],
  allProjects = [],
  isLoading = false,
  isError = false,
  refetch,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedProjId, setSelectedProjId] = useState('');
  const [unshareTarget, setUnshareTarget] = useState(null);

  const shareMutation = useShareProjectWithCrew(crewId);
  const unshareMutation = useUnshareProjectFromCrew(crewId);

  // Filter projects ready to share (not already shared)
  const shareableProjects = useMemo(() => {
    return allProjects.filter(
      (proj) => !sharedProjects.some((sp) => String(sp.id) === String(proj.id))
    );
  }, [allProjects, sharedProjects]);

  // Filter shared projects based on search & health radar filter
  const filteredProjects = useMemo(() => {
    return sharedProjects.filter((project) => {
      const matchesSearch =
        !searchQuery.trim() ||
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.createdBy?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (healthFilter === 'all') return true;
      const healthInfo = getHealthInfo(project);
      if (healthFilter === 'on_track') return healthInfo.status === 'On Track';
      if (healthFilter === 'at_risk') return healthInfo.status === 'At Risk';
      if (healthFilter === 'delayed') return healthInfo.status === 'Delayed';
      if (healthFilter === 'planning') return healthInfo.status === 'Planning';
      return true;
    });
  }, [sharedProjects, searchQuery, healthFilter]);

  // Handle Share Submission
  const handleShareSubmit = () => {
    if (!selectedProjId) return;
    shareMutation.mutate(selectedProjId, {
      onSuccess: () => {
        setSelectedProjId('');
        setIsShareModalOpen(false);
      },
    });
  };

  // Handle Unshare Confirmation
  const handleConfirmUnshare = () => {
    if (!unshareTarget) return;
    unshareMutation.mutate(unshareTarget.id, {
      onSuccess: () => {
        setUnshareTarget(null);
      },
    });
  };

  // UX State 3: Error State
  if (isError) {
    return (
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
        <ErrorState
          title="Failed to Load Shared Projects"
          description="We encountered an issue fetching the mission board for this crew. Please verify network connectivity."
          action={
            refetch && (
              <Button size="sm" variant="outline" onClick={refetch} className="gap-1.5 h-8 text-[12px]">
                <RefreshCw className="w-3.5 h-3.5" /> Retry Load
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Section Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Section Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <Heading level={3} className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              Shared Projects
              <Badge variant="outline" size="xs" className="font-mono">
                {sharedProjects.length}
              </Badge>
            </Heading>
            <Text variant="muted" className="text-[12px] mt-0.5">
              Execution projects linked to this crew, with live health and task tracking.
            </Text>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-[12px] bg-[var(--bg-card)] border-[var(--border-subtle)]"
            />
          </div>

          {/* Health Radar Filter Dropdown */}
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="h-8 w-[136px] text-[12px] bg-[var(--bg-card)] border-[var(--border-subtle)] font-medium">
              <SelectValue placeholder="Health Status" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="on_track">   On Track</SelectItem>
              <SelectItem value="at_risk">   At Risk</SelectItem>
              <SelectItem value="delayed">   Delayed</SelectItem>
              <SelectItem value="planning">  Planning</SelectItem>
            </SelectContent>
          </Select>

          {/* View Switcher (Grid vs Mini-Gantt) */}
          <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                viewMode === 'grid'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              )}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                viewMode === 'timeline'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              )}
              title="Mini-Gantt Timeline View"
            >
              <GanttChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          {/* Share Project Modal Trigger */}
          <Button
            size="sm"
            className="h-8 text-[12px] font-medium gap-1.5"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Share Project
          </Button>
        </div>
      </div>

      {/* UX State 1: Loading Skeleton */}
      {isLoading ? (
        <ProjectsTabSkeleton viewMode={viewMode} />
      ) : sharedProjects.length === 0 ? (
        /* UX State 2: Empty State */
        <ImmersiveEmptyState
          icon={FolderKanban}
          title="No shared projects yet"
          description="Link execution projects to this crew workspace to track objectives, health radar badges, and task deliverables together."
          action={
            <Button size="sm" onClick={() => setIsShareModalOpen(true)} className="h-8 text-[12px] gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Share First Project
            </Button>
          }
        />
      ) : filteredProjects.length === 0 ? (
        /* UX State 6: Filtered Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6">
          <Filter className="w-8 h-8 text-[var(--text-muted)] mb-2.5 opacity-60" />
          <Heading level={4} className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
            No projects match your filter
          </Heading>
          <Text variant="muted" className="text-[12px] max-w-sm mb-4">
            Try adjusting your search keywords or health status filter to display active mission boards.
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setHealthFilter('all');
            }}
            className="h-8 text-[12px] gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Clear Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* UX State 4: Active Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <SharedProjectCard
                key={project.id}
                project={project}
                index={index}
                canUnshare={isCreator}
                onRequestUnshare={(proj) => setUnshareTarget(proj)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* UX State 5: Mini-Gantt Timeline View */
        <MiniGanttTimelineView
          projects={filteredProjects}
          canUnshare={isCreator}
          onRequestUnshare={(proj) => setUnshareTarget(proj)}
        />
      )}

      {/* Share Project Modal */}
      <Modal open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-[15px] font-semibold">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              Share Project with Crew
            </ModalTitle>
            <ModalDescription className="text-[13px]">
              Choose an existing workspace project to share with this crew. Squad members will gain full task linkage and timeline monitoring.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-2">
            {shareableProjects.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-[12px] text-[var(--text-muted)]">
                All of your available workspace projects are already shared with this crew.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[var(--text-secondary)]">
                  Select Project
                </label>
                <Select value={selectedProjId} onValueChange={setSelectedProjId}>
                  <SelectTrigger className="w-full h-10 text-[13px] bg-[var(--bg-card)] border-[var(--border-default)]">
                    <SelectValue placeholder="Choose a project to link..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-60">
                    {shareableProjects.map((proj) => (
                      <SelectItem key={proj.id} value={String(proj.id)}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-semibold">{proj.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {proj.category || 'Project'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(false)}
              className="h-8 text-[12px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleShareSubmit}
              disabled={!selectedProjId || shareMutation.isPending || shareableProjects.length === 0}
              className="h-8 text-[12px] gap-1.5"
            >
              {shareMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sharing...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Confirm Share
                </>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Unshare Confirmation Modal */}
      <Modal open={!!unshareTarget} onOpenChange={(open) => !open && setUnshareTarget(null)}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader>
            <ModalTitle className="text-[15px] font-semibold text-[var(--danger)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Unshare Project from Crew?
            </ModalTitle>
            <ModalDescription className="text-[13px]">
              Are you sure you want to unshare <strong className="text-[var(--text-primary)]">{unshareTarget?.name}</strong>?
              Crew members will lose execution access to this board in their crew view.
            </ModalDescription>
          </ModalHeader>

          <ModalFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnshareTarget(null)}
              className="h-8 text-[12px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmUnshare}
              disabled={unshareMutation.isPending}
              className="h-8 text-[12px] gap-1.5"
            >
              {unshareMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Unsharing...
                </>
              ) : (
                <>
                  <Unlink className="w-3.5 h-3.5" /> Unshare Project
                </>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
