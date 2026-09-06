import { hashHue, avatarColor } from '@/shared/lib/avatar';

export const GLASS_PANEL =
  'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[var(--glass-saturate)] border border-[var(--glass-border)] shadow-[var(--shadow-md)]';

export const GLASS_FLOATING =
  'bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-[var(--glass-saturate)] border border-[var(--glass-border)] shadow-[var(--shadow-lg)]';

export { hashHue, avatarColor };

export function timeAgo(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatLastActive(memberTasksMap, userId) {
  const tasks = memberTasksMap[userId] || [];
  if (tasks.length === 0) return null;
  const sorted = [...tasks]
    .filter(t => t.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (sorted.length === 0) return null;
  return timeAgo(new Date(sorted[0].updatedAt));
}

export function hasRecentActivity(memberTasksMap, userId, hours = 24) {
  const tasks = memberTasksMap[userId] || [];
  const threshold = Date.now() - hours * 60 * 60 * 1000;
  return tasks.some(t => t.updatedAt && new Date(t.updatedAt).getTime() >= threshold);
}