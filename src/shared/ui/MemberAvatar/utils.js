/**
 * Ryokai — Shared Member Avatar Utilities
 *
 * Non-component exports (constants, helpers) separated from components
 * to satisfy React Fast Refresh's single-export-type constraint.
 */

/** Presence configuration — maps presence state to visual tokens */
export const PRESENCE_CONFIG = {
  active: {
    label: 'Active',
    dotBg: 'bg-[var(--success)]',
    textColor: 'text-[var(--success)]',
  },
  offline: {
    label: 'Offline',
    dotBg: 'bg-[var(--text-tertiary)]',
    textColor: 'text-[var(--text-muted)]',
  },
};

/** Get the first character of a member's display name, uppercased */
export function getMemberInitial(member) {
  return (member?.username || 'U').charAt(0).toUpperCase();
}

/** Resolve a member's presence status from various API shapes */
export function getMemberPresence(member) {
  if (!member) return 'offline';
  if (member.isOnline !== undefined) return member.isOnline ? 'active' : 'offline';
  if (member.presenceStatus) {
    const status = String(member.presenceStatus).toLowerCase();
    return status === 'active' || status === 'online' ? 'active' : 'offline';
  }
  return 'offline';
}
