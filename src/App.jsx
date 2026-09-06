import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AppProvider } from "@/app/providers/AppProvider";
import { ErrorBoundary } from "@/app/providers/ErrorBoundary";
import { InspectorProvider } from "@/shared/workspace-framework/interactions/InspectorContext";

import { AuthLayout } from "@/app/layouts/AuthLayout";
import { ProtectedRoute, PlatformRoute, TenantRoute } from "@/app/router/ProtectedRoute";
import { PublicRoute } from "@/app/router/PublicRoute";
import { RouteResolver } from "@/app/router/RouteResolver";
import { SessionExpiredListener } from "@/app/router/SessionExpiredListener";
import { RouteAnnouncer } from "@/app/router/RouteAnnouncer";
import { RouteSEO } from "@/app/router/RouteSEO";
import { MainLayout } from "@/app/layouts/MainLayout";
import { PlatformLayout } from "@/app/layouts/PlatformLayout";
import { PlatformPageGuard } from "@/platform/admin/components/PlatformGuard";

import {
  UIDesignSystem, LandingPage, LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage, SessionExpiredPage, OAuthCallbackPage,
  DashboardPage, TasksPage, TaskDetailPage, NebulaSpacePage, GithubPage, ProjectsPage, ProjectDetailPage, OrganizationsPage,
  OrganizationAdministrationPage, DirectoryPage, LeaveRequestsPage, RolesPermissionsPage, AnnouncementsPage, CrewsPage, CrewDetailPage, CrewDiscoverPage,
  CrewTasksPage, TeamsPage, TeamDetailPage, CrewJoinPage, InboxPage, AnalyticsPage, PlatformDashboardPage, PlatformOrganizationsPage,
  PlatformUsersPage, PlatformMonitoringPage, PlatformAuditPage, PlatformSettingsPage, FocusPage, ProfilePage, SecurityPage, SessionsPage,
  CalendarPage, NotesPage, SavedPage, WorkloadPage, GoalsPage, WhiteboardPage, AcceptInvitePage,
} from "@/app/router/RouteRegistry";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ErrorBoundary>
      <InspectorProvider>
        <AppProvider>
          <Router>
            <Routes>
              {/* Core Resolver */}
              <Route path="/" element={<RouteResolver />} />
              
              <Route path="/landing" element={<LandingPage />} />

              {/* OAuth redirect target -- outside PublicRoute so it runs for both anonymous and authenticated sessions */}
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

              {/* Public Auth Routes */}
              <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/session-expired" element={<SessionExpiredPage />} />
                </Route>
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/invite/accept/:token" element={<AcceptInvitePage />} />

                {/* PLATFORM APP (Control Plane) with per-route role guards */}
                <Route path="/platform" element={<PlatformRoute />}>
                  <Route element={<PlatformLayout />}>
                    <Route index element={<Navigate to="/platform/dashboard" replace />} />
                    <Route path="dashboard" element={<PlatformPageGuard><PlatformDashboardPage /></PlatformPageGuard>} />
                    <Route path="organizations" element={<PlatformPageGuard><PlatformOrganizationsPage /></PlatformPageGuard>} />
                    <Route path="users" element={<PlatformPageGuard><PlatformUsersPage /></PlatformPageGuard>} />
                    <Route path="monitoring" element={<PlatformPageGuard><PlatformMonitoringPage /></PlatformPageGuard>} />
                    <Route path="audit" element={<PlatformPageGuard><PlatformAuditPage /></PlatformPageGuard>} />
                    <Route path="health" element={<Navigate to="/platform/monitoring" replace />} />
                    <Route path="settings" element={<PlatformPageGuard><PlatformSettingsPage /></PlatformPageGuard>} />
                  </Route>
                </Route>

                {/* TENANT APP (Data Plane) */}
                <Route path="/app" element={<TenantRoute />}>
                  <Route path="nebula" element={<NebulaSpacePage />} />
                  <Route element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="tasks/:taskId" element={<TaskDetailPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                    <Route path="organizations" element={<OrganizationsPage />} />
                    <Route path="organizations/:orgId" element={<OrganizationAdministrationPage />} />
                    <Route path="teams" element={<TeamsPage />} />
                    <Route path="organizations/:orgId/teams/:teamId" element={<TeamDetailPage />} />
                    <Route path="organizations/:orgId/whiteboards/:boardId" element={<WhiteboardPage />} />
                    <Route path="organizations/:orgId/teams/:teamId/whiteboards/:boardId" element={<WhiteboardPage />} />
                    <Route path="crews" element={<CrewsPage />} />
                    <Route path="crews/discover" element={<CrewDiscoverPage />} />
                    <Route path="crews/join" element={<CrewJoinPage />} />
                    <Route path="crews/:crewId" element={<CrewDetailPage />} />
                    <Route path="crews/:crewId/whiteboards/:boardId" element={<WhiteboardPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="focus" element={<FocusPage />} />
                    <Route path="inbox" element={<InboxPage />} />
                    <Route path="settings/profile" element={<ProfilePage />} />
                    <Route path="settings/security" element={<SecurityPage />} />
                    <Route path="settings/sessions" element={<SessionsPage />} />
                    <Route path="sessions" element={<Navigate to="/app/settings/sessions" replace />} />
                    <Route path="notes" element={<NotesPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
<Route path="github" element={<GithubPage />} />
                    <Route path="saved" element={<SavedPage />} />
                    <Route path="goals" element={<GoalsPage />} />
                    <Route path="directory" element={<DirectoryPage />} />
                    <Route path="leave-requests" element={<LeaveRequestsPage />} />
                    <Route path="roles-permissions" element={<RolesPermissionsPage />} />
                    <Route path="announcements" element={<AnnouncementsPage />} />
                    <Route path="workload" element={<WorkloadPage />} />
                    <Route path="crews/tasks" element={<CrewTasksPage />} />
                  </Route>
                </Route>
              </Route>

              {import.meta.env.DEV && (
                <Route element={<ProtectedRoute />}>
                  <Route path="/ui" element={<UIDesignSystem />} />
                </Route>
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <SessionExpiredListener />
            <RouteAnnouncer />
            <RouteSEO />
          </Router>
        </AppProvider>
      </InspectorProvider>
    </ErrorBoundary>
    </MotionConfig>
  );
}
