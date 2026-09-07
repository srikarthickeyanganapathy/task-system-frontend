import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Icons } from '@/shared/ui/Icons'
import { EntityCard } from '@/shared/ui/entity-card'
import { formatTimeAgo } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import { toast } from 'sonner'
import { hashHue, teamMood, pseudoActivityTimestamp } from './utils'
import { TeamAvatar } from './TeamAvatar'

/* ===
 * TEAM TILE (PREMIUM CARD) -- extracted from TeamsPage
 * === */

export function TeamTile({ team, stats, isMember, orgId, canManage, canManageTeam, navigate, setSelectedTeam, isSelected, compareMode, onToggleCompare }) {
  const [isHovered, setIsHovered] = useState(false)
  const hue = hashHue(team.name)
  const memberCount = team.members?.length ?? 0
  const canEnterTeam = isMember || canManageTeam || canManage
  const lastActive = formatTimeAgo(pseudoActivityTimestamp(team.id) || team.updatedAt)
  const mood = teamMood(team.name)

  const handleEnterTeam = useCallback((e) => {
    if (e) e.stopPropagation()
    if (compareMode) {
      onToggleCompare?.(team)
      return
    }
    if (canEnterTeam) {
      navigate(`/app/organizations/${orgId}/teams/${team.id}`)
    } else {
      toast.warning('You are not a member of this team.')
    }
  }, [canEnterTeam, compareMode, navigate, orgId, team, onToggleCompare])

  const completionPct = stats.taskCount > 0 ? Math.round((stats.doneCount / stats.taskCount) * 100) : 0
  const memberAvatars = (team.members || []).slice(0, 4).map((m, i) => ({
    initials: (m.username || '?').charAt(0).toUpperCase(),
    color: `hsl(${hashHue(m.username || String(i))} 55% 48%)`,
    title: m.username,
  }))

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      <EntityCard
        type="team"
        glyph={<TeamAvatar name={team.name} size="md" hue={hue} />}
        name={team.name}
        tagline={team.description || 'No description'}
        disabled={!canEnterTeam && !compareMode}
        selected={isSelected}
        onClick={handleEnterTeam}
        badges={[
          <span key="mood" className="ec-badge ec-badge--ghost" title="Team mood">{mood}</span>,
          ...(isMember ? [<span key="member" className="ec-badge ec-badge--accent"><span className="ec-dot" />Member</span>] : []),
        ]}
        actions={
          <div className="ec-actions" style={{ position: 'relative' }}>
            {compareMode && (
              <button
                type="button"
                className={cn('ec-kebab', isSelected && 'text-[var(--accent)]')}
                onClick={(e) => { e.stopPropagation(); onToggleCompare?.(team) }}
                title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
              >
                <Icons.check className="w-4 h-4" />
              </button>
            )}
            {canManageTeam && !compareMode && (
              <button
                type="button"
                className="ec-kebab"
                onClick={(e) => { e.stopPropagation(); setSelectedTeam(team) }}
                title="Manage team"
                aria-label="Manage team"
              >
                <Icons.settings className="w-4 h-4" />
              </button>
            )}
          </div>
        }
        meta={[
          { icon: <Icons.checkSquare style={{ width: 11, height: 11 }} />, text: `${stats.activeTaskCount} ${stats.activeTaskCount === 1 ? 'task' : 'tasks'}` },
          { icon: <Icons.folder style={{ width: 11, height: 11 }} />, text: `${stats.projectCount} ${stats.projectCount === 1 ? 'project' : 'projects'}` },
          ...(lastActive ? [{ icon: <Icons.clock style={{ width: 11, height: 11 }} />, text: `Active ${lastActive}` }] : []),
        ]}
        avatars={memberAvatars}
        avatarOverflow={Math.max(0, memberCount - 4)}
        progress={stats.projectCount > 0 ? completionPct : null}
        progressLabel={stats.projectCount > 0 ? `${completionPct}%` : undefined}
        footer={
          <div className="ec-card-foot">
            <span className="text-[11px] text-[var(--text-muted)]">{memberCount} member{memberCount === 1 ? '' : 's'}</span>
            {canEnterTeam && !compareMode && (
              <span className="text-[11px] font-semibold flex items-center gap-1 transition-colors" style={{ color: isHovered ? `hsl(${hue} 70% 50%)` : 'var(--text-muted)' }}>
                <motion.span animate={{ x: isHovered ? 2 : 0 }} transition={{ duration: 0.2 }}><Icons.arrowRight className="w-3.5 h-3.5" aria-label="Open team" /></motion.span>
              </span>
            )}
          </div>
        }
      />
    </motion.div>
  )
}
