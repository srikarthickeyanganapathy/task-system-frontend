import { cn } from '@/shared/lib/cn';
import { MemberAvatar, RoleLabel, PresenceLabel } from './MemberAvatar';
import { formatJoinDate, getMemberPresence, highlightText } from './utils';

// --- Minimalist table view ---
export function MemberTable({ members, isCreator, searchQuery, getWorkload, onSelect, onTransfer, onRemove }) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="py-2.5 px-4 text-xs font-medium text-[var(--text-muted)]">Member</th>
            <th className="py-2.5 px-4 text-xs font-medium text-[var(--text-muted)]">Role</th>
            <th className="py-2.5 px-4 text-xs font-medium text-[var(--text-muted)]">Presence</th>
            <th className="py-2.5 px-4 text-xs font-medium text-[var(--text-muted)]">Workload</th>
            <th className="py-2.5 px-4 text-xs font-medium text-[var(--text-muted)]">Joined</th>
            <th className="py-2.5 px-4 text-xs font-medium text-[var(--text-muted)] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {members.map((member) => {
            const workload = getWorkload(member.username);
            const isOwner = member.role === 'CREATOR' || member.role === 'OWNER';
            const presence = getMemberPresence(member);

            return (
              <tr
                key={member.userId || member.username}
                onClick={() => onSelect(member)}
                className="hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={member} size="sm" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)] block truncate">
                        {highlightText(member.username || 'Unknown', searchQuery)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block truncate">
                        {highlightText(member.email || 'No email', searchQuery)}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <RoleLabel member={member} />
                </td>

                <td className="py-3 px-4">
                  <PresenceLabel presence={presence} />
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 max-w-[120px]">
                    <div className="flex-1 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', workload.barColor)}
                        style={{ width: workload.active > 0 ? `${Math.min(100, (workload.active / 6) * 100)}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">{workload.active}</span>
                  </div>
                </td>

                <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
                  {formatJoinDate(member.joinedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>

                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <button
                      className="font-medium text-[var(--accent)] hover:opacity-80"
                      onClick={() => onSelect(member)}
                    >
                      Details
                    </button>
                    {isCreator && !isOwner && (
                      <>
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
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}