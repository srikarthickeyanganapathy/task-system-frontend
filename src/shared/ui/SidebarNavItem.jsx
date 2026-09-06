import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn'
import {
  LayoutDashboard, Inbox, CheckSquare, FolderClosed, Zap,
  Calendar, Pencil, BarChart2, Bookmark, Users, Building2,
  Network, Clock, Megaphone, Shield, ShieldAlert, Settings,
  Rocket, Compass, Target, Scale, ChevronLeft,
  Search, Plus, LogOut, User,
  Star, Github , ChevronRight
} from 'lucide-react';

export const ICONS = {
  dashboard: LayoutDashboard, inbox: Inbox, tasks: CheckSquare,
  projects: FolderClosed, focus: Zap, calendar: Calendar,
  notes: Pencil, analytics: BarChart2, saved: Bookmark,
  teams: Users, directory: Network, leave: Clock,
  announcements: Megaphone, roles: Shield, admin: ShieldAlert,
  settings: Settings, crews: Rocket, discover: Compass,
  goals: Target, workload: Scale, org: Building2, github: Github,
  back: ChevronLeft, search: Search, plus: Plus,
  star: Star
};

export function SidebarNavItem({ to, icon, label, isExpanded, end = false, badge, onClick, onMouseEnter, onFocus, avatarLetter }) {
  const IconComp = typeof icon === 'string' ? ICONS[icon] : icon;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      title={!isExpanded ? label : undefined}
      aria-label={label}
      className={({ isActive }) => cn(
        "relative flex items-center transition-all duration-150 group shrink-0 rounded-lg",
        isExpanded ? "w-full h-9 px-2.5 justify-start" : "justify-center w-10 h-10",
        isActive
          ? "text-[var(--accent)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-bg"
              className={cn("absolute inset-0 bg-[var(--accent-soft)]", isExpanded ? "rounded-lg" : "rounded-xl")}
              transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.5 }}
            />
          )}
          {avatarLetter ? (
            <div className={cn("relative w-[18px] h-[18px] rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors duration-150", isActive ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] group-hover:bg-[var(--bg-hover)]")}>
              {avatarLetter}
            </div>
          ) : IconComp && (
            <IconComp
              className={cn("relative w-[18px] h-[18px] shrink-0 transition-colors duration-150", isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]")}
              strokeWidth={1.5}
            />
          )}
          {isExpanded && label && (
            <div className="relative ml-2.5 flex-1 flex items-center justify-between min-w-0">
              <span className={cn("text-[13px] font-medium truncate transition-colors duration-150", isActive ? "text-[var(--accent)] font-semibold" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")}>
                {label}
              </span>
              {badge !== undefined && badge > 0 && (
                <span className={cn("ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-semibold tabular-nums", isActive ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-hover)] text-[var(--text-tertiary)]")}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}
