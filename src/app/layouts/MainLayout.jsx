import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/app/providers/WorkspaceProvider'
import { prefetchNotes } from '@/note'
import { prefetchDashboardStats } from '@/analytics'
import { prefetchCalendarEvents } from '@/calendar'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { AppSidebar, AppTopbar, GlobalCommandPalette } from '@/platform/workspace'
import { WorkspaceInspector } from "@/shared/workspace-framework/interactions/inspector/WorkspaceInspector"
import { useShortcuts } from "@/shared/hooks/useShortcuts"
import { CosmicBackground } from '@/shared/ui/CosmicBackground'
import {
  DrawerProvider,
  DrawerOutlet,
  MemberProfileDrawer,
  TaskDrawer,
  ProjectDrawer,
  TeamDrawer,
} from '@/shared/workspace-framework'
import { SignalDrawer } from '@/dashboard'
import { OnboardingRoot } from '@/onboarding'

/** Registry of contextual drawers keyed by drawer ID. */
const DRAWER_REGISTRY = {
  member: MemberProfileDrawer,
  task: TaskDrawer,
  project: ProjectDrawer,
  team: TeamDrawer,
  signal: SignalDrawer,
}

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const qc = useQueryClient()
  const { workspaceMode, activeOrganization, activeCrew } = useWorkspace()

  // Background idle prefetch for Analytics and Notes on router transitions
  useEffect(() => {
    const idleCallback = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb) => setTimeout(cb, 400);
    const cancelCallback = typeof cancelIdleCallback === 'function' ? cancelIdleCallback : clearTimeout;

    const handle = idleCallback(() => {
      const noteScope = workspaceMode === 'ORG' && activeOrganization?.id
        ? { orgId: activeOrganization.id }
        : workspaceMode === 'CREWS' && activeCrew?.id
        ? { crewId: activeCrew.id }
        : {};

      const statsParams = workspaceMode === 'ORG'
        ? { scope: 'ORG', orgId: activeOrganization?.id }
        : workspaceMode === 'CREWS'
        ? { scope: 'CREWS', crewId: activeCrew?.id }
        : { scope: 'PERSONAL' };

      const now = new Date();
      const calStart = startOfWeek(startOfMonth(now)).toISOString();
      const calEnd = endOfWeek(endOfMonth(now)).toISOString();

      prefetchNotes(qc, noteScope);
      prefetchDashboardStats(qc, statsParams);
      prefetchCalendarEvents(qc, calStart, calEnd, noteScope);
    });

    return () => cancelCallback(handle);
  }, [location.pathname, workspaceMode, activeOrganization?.id, activeCrew?.id, qc]);

  // Global keyboard shortcuts
  useShortcuts()

  return (
    <div className="flex h-screen w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] overflow-hidden font-sans relative">
      {/* Skip link for keyboard / screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[300] focus:px-4 focus:py-2.5 focus:rounded-lg focus:text-sm focus:font-semibold focus:bg-[var(--accent)] focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>

      
      {/* Cosmic ambient particles -- Ryokai signature atmosphere */}
      <CosmicBackground variant="full" opacity={0.25} />
      
      {/* Sidebar - Desktop is persistent, Mobile is drawer */}
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative p-2 md:p-3">
        {/* Curvy Main Content Area */}
        <div className="flex flex-1 flex-col bg-[var(--bg-base)] rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border-subtle)] overflow-hidden relative">
          
          {/* Persistent Topbar */}
          <AppTopbar onMenuClick={() => setSidebarOpen(true)} />

          {/* Dynamic Page Content */}
          <DrawerProvider>
            <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Contextual Drawer Outlet (Member, Task, Project, Team) */}
            <DrawerOutlet drawers={DRAWER_REGISTRY} />
          </DrawerProvider>
        </div>
      </div>
      
      {/* Global Command Palette & Inspector */}
      <GlobalCommandPalette />
      <WorkspaceInspector />

      {/* First-run welcome + Help Center (backend-gated, reopenable) */}
      <OnboardingRoot />
    </div>
  )
}
