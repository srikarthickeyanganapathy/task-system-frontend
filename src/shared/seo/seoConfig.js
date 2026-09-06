export const ROUTE_SEO_CONFIG = {
  // Public marketing & auth routes
  '/': {
    title: 'Ryokai — The system for turning intent into execution',
    description: 'Ryokai is the operating system for engineering teams to manage tasks, track velocity, and align execution with zero friction.',
    noindex: false,
  },
  '/landing': {
    title: 'Ryokai — The system for turning intent into execution',
    description: 'Purpose-built for engineering teams to turn intent into execution with real-time collaboration, tracking, and dependencies.',
    noindex: false,
  },
  '/login': {
    title: 'Sign In',
    description: 'Sign in to your Ryokai workspace to continue shipping high-impact work.',
    noindex: false,
  },
  '/register': {
    title: 'Create an Account',
    description: 'Join Ryokai and power up your team execution with modern workflows and intelligent tracking.',
    noindex: false,
  },
  '/forgot-password': {
    title: 'Forgot Password',
    description: 'Reset your Ryokai password and regain access to your workspace.',
    noindex: false,
  },

  // Tenant App Routes (Private, authenticated - noindex)
  '/app': {
    title: 'Mission Control Dashboard',
    description: 'Real-time overview of tasks, velocity, blockers, and project activity.',
    noindex: true,
  },
  '/app/tasks': {
    title: 'Tasks & Issues',
    description: 'Manage, organize, and prioritize team and personal tasks with real-time tracking.',
    noindex: true,
  },
  '/app/projects': {
    title: 'Projects',
    description: 'Track roadmap progress, milestones, and deliverables across all active projects.',
    noindex: true,
  },
  '/app/analytics': {
    title: 'Analytics & Velocity',
    description: 'Comprehensive workspace metrics, completion trends, velocity, and stage breakdowns.',
    noindex: true,
  },
  '/app/notes': {
    title: 'Notes & Documentation',
    description: 'Capture ideas, draft specs, manage checklists, and organize workspace documentation.',
    noindex: true,
  },
  '/app/calendar': {
    title: 'Calendar',
    description: 'Schedule milestones, view deadlines, and coordinate team deliverables on an interactive calendar.',
    noindex: true,
  },
  '/app/focus': {
    title: 'Focus Mode',
    description: 'Distraction-free environment dedicated to deep work and high-priority execution.',
    noindex: true,
  },
  '/app/inbox': {
    title: 'Inbox & Notifications',
    description: 'Stay updated with task assignments, mentions, reviews, and status transitions.',
    noindex: true,
  },
  '/app/nebula': {
    title: 'Nebula 3D Space',
    description: 'Explore your organization dependency graph and tasks in interactive 3D space.',
    noindex: true,
  },
  '/app/crews': {
    title: 'Crews',
    description: 'Discover and collaborate across cross-functional autonomous crews.',
    noindex: true,
  },
  '/app/saved': {
    title: 'Saved Items',
    description: 'Quickly access bookmarked tasks, notes, and projects.',
    noindex: true,
  },
  '/app/goals': {
    title: 'Organizational Goals',
    description: 'Align execution with high-level OKRs and key strategic goals.',
    noindex: true,
  },
  '/app/workload': {
    title: 'Team Workload',
    description: 'Balance resource capacity and prevent burnout across team members.',
    noindex: true,
  },
  '/app/directory': {
    title: 'Team Directory',
    description: 'Browse team members, roles, and department hierarchies.',
    noindex: true,
  },
  '/app/settings/profile': {
    title: 'Profile Settings',
    description: 'Manage your profile information, appearance preferences, and notifications.',
    noindex: true,
  },
  '/app/settings/security': {
    title: 'Security Settings',
    description: 'Manage password, two-factor authentication, and security preferences.',
    noindex: true,
  },
  '/app/settings/sessions': {
    title: 'Active Sessions',
    description: 'Review and revoke active login sessions across your devices.',
    noindex: true,
  },

  // Platform Control Plane Routes
  '/platform/dashboard': {
    title: 'Platform Control Plane',
    description: 'Multi-tenant administration, health metrics, and ecosystem telemetry.',
    noindex: true,
  },
  '/platform/organizations': {
    title: 'Platform Organizations',
    description: 'Manage tenant accounts, quotas, and subscription tiers.',
    noindex: true,
  },
  '/platform/users': {
    title: 'Platform Users',
    description: 'Global user registry, directory search, and authentication controls.',
    noindex: true,
  },
  '/platform/monitoring': {
    title: 'System Monitoring',
    description: 'Real-time telemetry, service latency, and infrastructure status.',
    noindex: true,
  },
  '/platform/audit': {
    title: 'Platform Audit Log',
    description: 'Immutable compliance trail of administrative actions and security events.',
    noindex: true,
  },
}

/**
 * Resolves SEO metadata by route pathname pattern.
 * Supports exact matches and prefix / parent matching.
 */
export function getRouteSEO(pathname) {
  if (!pathname) return ROUTE_SEO_CONFIG['/']

  // Exact match
  if (ROUTE_SEO_CONFIG[pathname]) {
    return ROUTE_SEO_CONFIG[pathname]
  }

  // Normalized path (e.g. remove trailing slash)
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (ROUTE_SEO_CONFIG[normalized]) {
    return ROUTE_SEO_CONFIG[normalized]
  }

  // Prefix matching for nested routes
  if (pathname.startsWith('/app/tasks/')) {
    return {
      title: 'Task Details',
      description: 'View task details, discussion, and subtask dependencies.',
      noindex: true,
    }
  }
  if (pathname.startsWith('/app/projects/')) {
    return {
      title: 'Project Details',
      description: 'Detailed project view, sprint breakdown, and milestones.',
      noindex: true,
    }
  }
  if (pathname.startsWith('/app/crews/')) {
    return {
      title: 'Crew Details',
      description: 'Crew workspace, mission deliverables, and members.',
      noindex: true,
    }
  }
  if (pathname.startsWith('/app/organizations/')) {
    return {
      title: 'Organization Administration',
      description: 'Manage organization members, teams, and workspace configurations.',
      noindex: true,
    }
  }
  if (pathname.startsWith('/platform/')) {
    return {
      title: 'Platform Control Plane',
      description: 'Ryokai Platform Management',
      noindex: true,
    }
  }
  if (pathname.startsWith('/app/')) {
    return {
      title: 'Workspace',
      description: 'Ryokai workspace execution environment.',
      noindex: true,
    }
  }

  return ROUTE_SEO_CONFIG['/']
}
