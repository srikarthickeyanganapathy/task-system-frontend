import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Text } from '@/shared/ui/Typography';
import { TrendingUp, ChevronDown, ChevronUp } from '@/shared/ui/Icons';
import { avatarColor, timeAgo } from './directoryUtils';

export function RecentActivityFeed({ recentlyJoined, expanded, onToggleExpanded, onSelectMember }) {
  return (
    <div className="mt-8 border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <button type="button" onClick={onToggleExpanded} className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-subtle)]/50 transition-colors">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Recent activity</span>
          <span className="text-xs text-[var(--text-muted)]">{recentlyJoined.length > 0 ? `${recentlyJoined.length} joined` : 'All caught up'}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
              <div className="space-y-1">
                <Text className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Recently joined (last 30 days)</Text>
                {recentlyJoined.length > 0 ? (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {recentlyJoined.slice(0, 6).map((member) => {
                      const joinedDate = member.joinedAt || member.createdAt;
                      return (
                        <div key={member.userId} className="flex items-center gap-3 py-2.5 cursor-pointer group" onClick={() => onSelectMember(member)}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-white text-xs shrink-0" style={{ backgroundColor: avatarColor(member.username || '?') }}>
                            {member.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">{member.username}</div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span>{member.orgRole}</span>
                              {joinedDate && <><span>·</span><span>{timeAgo(new Date(joinedDate))}</span></>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Text size="xs" variant="muted">No new members joined in the last 30 days.</Text>
                )}
              </div>

              <div className="space-y-1">
                <Text className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Role changes (this week)</Text>
                <Text size="xs" variant="muted">No role changes recorded this week.</Text>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}