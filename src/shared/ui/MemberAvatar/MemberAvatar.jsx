import { cn } from '@/shared/lib/cn';
import { avatarColor } from '@/shared/lib/avatar';
import { PRESENCE_CONFIG, getMemberPresence, getMemberInitial } from './utils';

/**
 * Ryokai — Shared Member Avatar Components
 *
 * Unified avatar, role label, and presence label components used across
 * both the Crew and Directory modules.
 */

/** Role, as plain text — weight and color carry the meaning, no pill needed */
export function RoleLabel({ member, className }) {
  const isOwner = member.role === 'CREATOR' || member.role === 'OWNER';
  const isAdmin = member.role === 'ADMIN';

  return (
    <span
      className={cn(
        'text-xs font-medium',
        isOwner ? 'text-[var(--accent)]' : isAdmin ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
        className
      )}
    >
      {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
    </span>
  );
}

/** Presence status dot + label */
export function PresenceLabel({ presence, className }) {
  const cfg = PRESENCE_CONFIG[presence] || PRESENCE_CONFIG.offline;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', cfg.textColor, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotBg)} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

/** Flat-color initial avatar with a presence dot */
export function MemberAvatar({ member, size = 'md', className }) {
  const presence = getMemberPresence(member);
  const cfg = PRESENCE_CONFIG[presence] || PRESENCE_CONFIG.offline;

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn('rounded-full flex items-center justify-center font-medium text-white', sizes[size])}
        style={{ backgroundColor: avatarColor(member?.username || member?.email || '') }}
        aria-hidden="true"
      >
        {getMemberInitial(member)}
      </div>
      <span
        className={cn(
          'absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--bg-card)]',
          dotSizes[size],
          cfg.dotBg
        )}
        aria-hidden="true"
      />
    </div>
  );
}
