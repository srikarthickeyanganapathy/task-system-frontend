import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Text } from '@/shared/ui/Typography';
import { cn } from '@/shared/lib/cn';
import { SPRINGS } from '@/shared/lib/uxTokens';
import { Users2, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from '@/shared/ui/Icons';
import { GLASS_FLOATING, avatarColor } from './directoryUtils';

const PRIORITY_LABELS = { 0: 'Administrators', 1: 'Directors', 2: 'Managers', 3: 'Members' };
const getPriorityLabel = (priority) => PRIORITY_LABELS[priority] || `Tier ${priority}`;

// --- Tree builder ---
function buildOrgTree(members) {
  const memberMap = new Map();
  const roots = [];

  members.forEach((m) => memberMap.set(m.userId, { ...m, children: [] }));
  members.forEach((m) => {
    const parentId = m.reportsTo || m.managerId;
    if (parentId && memberMap.has(parentId) && parentId !== m.userId) {
      memberMap.get(parentId).children.push(memberMap.get(m.userId));
    } else {
      roots.push(memberMap.get(m.userId));
    }
  });

  const hasRelationships = members.some((m) => (m.reportsTo || m.managerId) && memberMap.has(m.reportsTo || m.managerId));
  if (!hasRelationships || roots.length === 0) return null;
  return roots;
}

// --- Empty state illustration ---
function EmptyOrgIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mb-4 opacity-40">
      <rect x="60" y="4" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
      <circle cx="80" cy="14" r="6" fill="var(--text-muted)" opacity="0.3" />
      <line x1="80" y1="24" x2="80" y2="40" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="20" y1="52" x2="140" y2="52" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="4" y="58" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
      <circle cx="24" cy="68" r="6" fill="var(--text-muted)" opacity="0.3" />
      <rect x="60" y="58" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
      <circle cx="80" cy="68" r="6" fill="var(--text-muted)" opacity="0.3" />
      <rect x="116" y="58" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
      <circle cx="136" cy="68" r="6" fill="var(--text-muted)" opacity="0.3" />
      <line x1="24" y1="78" x2="24" y2="92" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="80" y1="78" x2="80" y2="92" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="136" y1="78" x2="136" y2="92" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="4" y="96" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
      <rect x="60" y="96" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
      <rect x="116" y="96" width="40" height="20" rx="6" fill="var(--bg-subtle)" stroke="var(--border-subtle)" strokeWidth="1.5" />
    </svg>
  );
}

// --- Zoom controls -- the one floating element in this view, so: glass ---
function ZoomControls({ scale, onZoomIn, onZoomOut, onFitToScreen }) {
  return (
    <div className={cn('absolute bottom-4 right-4 flex items-center gap-0.5 rounded-lg p-1 z-20', GLASS_FLOATING)}>
      <button onClick={onZoomOut} disabled={scale <= 0.3} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] disabled:opacity-30" title="Zoom out">
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs font-medium text-[var(--text-secondary)] min-w-[36px] text-center tabular-nums select-none">
        {Math.round(scale * 100)}%
      </span>
      <button onClick={onZoomIn} disabled={scale >= 2} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] disabled:opacity-30" title="Zoom in">
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-[var(--border-subtle)] mx-0.5" />
      <button onClick={onFitToScreen} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)]" title="Fit to screen">
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// --- Flat node card, used by both the tree and tiered layouts ---
function OrgNode({ member, onClick, isSearchMatch, teamCount = 0, depth = 0 }) {
  const isSuspended = member.status === 'SUSPENDED';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRINGS.fast}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(member)}
      className={cn(
        'relative flex flex-col items-center rounded-lg px-4 py-3 cursor-pointer transition-colors border bg-[var(--bg-card)] w-[140px]',
        isSearchMatch ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
        isSuspended && 'opacity-60'
      )}
    >
      {depth > 0 && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--border-subtle)]" />}

      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium text-white mb-2"
        style={{ backgroundColor: avatarColor(member.username || '?') }}
      >
        {member.username?.charAt(0).toUpperCase() || '?'}
      </div>

      <span className="text-sm font-medium text-[var(--text-primary)] text-center truncate w-full">{member.username}</span>
      <span className="text-xs text-[var(--text-muted)] mt-0.5">{member.orgRole || 'Member'}</span>

      {teamCount > 0 && (
        <span className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1">
          <Users2 className="w-3 h-3" />
          {teamCount} {teamCount === 1 ? 'team' : 'teams'}
        </span>
      )}

      {isSuspended && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--danger)] border-2 border-[var(--bg-card)] rounded-full" title="Suspended" />
      )}
    </motion.div>
  );
}

// --- Recursive tree node ---
function TreeNode({ node, onClick, searchQuery, depth = 0, teamCount = 0 }) {
  const isSearchMatch = searchQuery?.trim() ? (node.username || '').toLowerCase().includes(searchQuery.toLowerCase()) : false;

  return (
    <div className="flex flex-col items-center" style={{ minWidth: depth > 0 ? 160 : 180 }}>
      <OrgNode member={node} onClick={onClick} isSearchMatch={isSearchMatch} teamCount={teamCount} depth={depth} />

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-0">
          <div className="w-px h-6 bg-[var(--border-subtle)]" />
          <div className="relative flex items-start justify-center">
            <div
              className="absolute top-0 border-t border-[var(--border-subtle)]"
              style={{ width: `${Math.max((node.children.length - 1) * 30, 10)}px`, left: '50%', transform: 'translateX(-50%)' }}
            />
            <div className="flex items-start justify-center gap-6 pt-6">
              {node.children.map((child) => (
                <div key={child.userId} className="flex flex-col items-center">
                  <div className="w-px h-6 bg-[var(--border-subtle)] -mt-6 mb-0" />
                  <TreeNode node={child} onClick={onClick} searchQuery={searchQuery} depth={depth + 1} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Tiered fallback layout ---
function TieredLayout({ groupedMembers, onSelectMember, searchQuery, memberTeamsMap }) {
  const [expandedTiers, setExpandedTiers] = useState({});
  const toggleTier = (priority) => setExpandedTiers((prev) => ({ ...prev, [priority]: !prev[priority] }));

  return (
    <div className="flex flex-col items-center w-full pb-6">
      {groupedMembers.map((group, groupIdx) => {
        const isExpanded = expandedTiers[group.priority];
        const visibleMembers = isExpanded ? group.members : group.members.slice(0, 6);
        const hiddenCount = group.members.length - visibleMembers.length;

        return (
          <div key={group.priority} className="flex flex-col items-center w-full min-w-[600px]">
            <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">{getPriorityLabel(group.priority)}</span>
              <span>{group.members.length} {group.members.length === 1 ? 'person' : 'people'}</span>
            </div>

            <div className="flex justify-center gap-4 flex-wrap w-full mb-4">
              {visibleMembers.map((member) => {
                const teams = memberTeamsMap?.[member.userId] || [];
                const isSearchMatch = searchQuery?.trim() ? (member.username || '').toLowerCase().includes(searchQuery.toLowerCase()) : false;
                return (
                  <OrgNode key={member.userId} member={member} onClick={() => onSelectMember(member)} isSearchMatch={isSearchMatch} teamCount={teams.length} />
                );
              })}

              {group.members.length > 6 && (
                <button
                  onClick={() => toggleTier(group.priority)}
                  className="flex flex-col items-center justify-center w-[140px] py-4 rounded-lg border border-dashed border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                >
                  <ChevronDown className={cn('w-4 h-4 text-[var(--text-muted)] transition-transform', isExpanded && 'rotate-180')} />
                  <Text size="xs" variant="muted" className="mt-1">
                    {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                  </Text>
                </button>
              )}
            </div>

            {groupIdx < groupedMembers.length - 1 && <div className="w-2/3 border-t border-[var(--border-subtle)] mb-4" />}
          </div>
        );
      })}
    </div>
  );
}

// --- Main component ---
export function DirectoryOrgChart({ members, onSelectMember, searchQuery = '', memberTeamsMap = {} }) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const treeRoots = useMemo(() => buildOrgTree(members), [members]);

  const groupedMembers = useMemo(() => {
    const groups = {};
    members.forEach((member) => {
      const priority = member.rolePriority ?? 999;
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push(member);
    });
    return Object.keys(groups).sort((a, b) => Number(a) - Number(b)).map((key) => ({ priority: Number(key), members: groups[key] }));
  }, [members]);

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerW = containerRef.current.clientWidth - 48;
    const contentW = contentRef.current.scrollWidth;
    if (contentW <= containerW) {
      setScale(1);
    } else {
      setScale(Math.min(1, Math.max(0.3, containerW / contentW)));
    }
  }, []);

  const handleZoomIn = useCallback(() => setScale((p) => Math.min(2, Math.round((p + 0.1) * 10) / 10)), []);
  const handleZoomOut = useCallback(() => setScale((p) => Math.max(0.3, Math.round((p - 0.1) * 10) / 10)), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setScale((prev) => Math.max(0.3, Math.min(2, Math.round((prev + delta) * 20) / 20)));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-lg">
        <EmptyOrgIllustration />
        <Text size="sm" className="font-medium text-[var(--text-secondary)] mb-1">No members to display</Text>
        <Text size="xs" variant="muted">Add members to your organization to see the chart here.</Text>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-auto rounded-lg border border-[var(--border-subtle)]" style={{ minHeight: 300, maxHeight: 'calc(100vh - 280px)' }}>
      <div
        ref={contentRef}
        className="flex items-start justify-center py-8 px-6 min-w-min"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
      >
        {treeRoots ? (
          <div className="flex flex-col items-center gap-0">
            {treeRoots.map((root) => (
              <TreeNode key={root.userId} node={root} onClick={onSelectMember} searchQuery={searchQuery} depth={0} teamCount={(memberTeamsMap?.[root.userId] || []).length} />
            ))}
          </div>
        ) : (
          <TieredLayout groupedMembers={groupedMembers} onSelectMember={onSelectMember} searchQuery={searchQuery} memberTeamsMap={memberTeamsMap} />
        )}
      </div>

      <ZoomControls scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onFitToScreen={handleFitToScreen} />
    </div>
  );
}

export default DirectoryOrgChart;