import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/cn';
import { Mail, CalendarDays } from '@/shared/ui/Icons';
import { RoleLabel, PresenceLabel, MemberAvatar } from './MemberAvatar';
import { formatJoinDate, getMemberPresence, highlightText } from './utils';

// --- Minimalist member grid card ---
export function MemberCard({ member, isCreator, index, searchQuery, workload, onSelect, onTransfer, onRemove }) {
  const isOwner = member.role === 'CREATOR' || member.role === 'OWNER';
  const presence = getMemberPresence(member);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      onClick={() => onSelect(member)}
      className="group bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-4 hover:border-[var(--border-default)] transition-colors cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start gap-3 mb-4">
          <MemberAvatar member={member} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
              {highlightText(member.username || 'Unknown', searchQuery)}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {highlightText(member.email || 'No email registered', searchQuery)}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <RoleLabel member={member} />
              <span className="text-[var(--border-default)]">·</span>
              <PresenceLabel presence={presence} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              {workload.active} active · {workload.completed} done
            </span>
            <span className={workload.levelColor}>{workload.level}</span>
          </div>
          <div className="w-full h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', workload.barColor)}
              style={{ width: workload.active > 0 ? `${Math.min(100, (workload.active / 6) * 100)}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <CalendarDays className="w-3.5 h-3.5" />
          Joined {formatJoinDate(member.joinedAt, { month: 'short', year: 'numeric' })}
        </span>

        {isCreator && !isOwner && (
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded px-1"
              onClick={() => onTransfer(member.userId)}
              aria-label={`Transfer ownership to ${member.username}`}
            >
              Make owner
            </button>
            <button
              className="font-medium text-[var(--danger)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] rounded px-1"
              onClick={() => onRemove(member.userId)}
              aria-label={`Remove ${member.username} from crew`}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}