import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/Button';
import { Heading, Text } from '@/shared/ui/Typography';
import { ErrorState } from '@/shared/ui/ErrorState';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter
} from '@/shared/ui/Modal';
import { PageShell, PageHero, PageContent } from '@/shared/ui/PageShell';
import { PageState } from '@/shared/ui/PageState';
import { EntityCard, EntityStatStrip, EntityFilterBar } from '@/shared/ui/entity-card';
import { useDiscoverCrews, useJoinPublicCrew } from '../features/hooks/useCrews';
import {
  Search, Users, Flame, CheckCircle2, Loader2,
  ArrowUpRight, Lock, Globe, Eye, RefreshCw, WifiOff, X, TrendingUp,
  UserPlus, Layers, Sparkles
} from '@/shared/ui/Icons';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Surface } from '@/shared/ui/Surface';
import { hashHue } from '@/shared/lib/avatar';
import { STAGGER_FAST, FADE_IN_UP, SPRINGS } from '@/shared/lib/uxTokens';

const categories = ['All', 'Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Growth', 'Research'];

function inferCategory(crew) {
  if (crew.category) return crew.category;
  const text = `${crew.name} ${crew.description || ''}`.toLowerCase();
  if (/design|ui|ux/.test(text)) return 'Design';
  if (/dev|eng|code|api/.test(text)) return 'Engineering';
  if (/market|growth|seo/.test(text)) return 'Marketing';
  if (/prod|roadmap/.test(text)) return 'Product';
  if (/ops|operation/.test(text)) return 'Operations';
  if (/research|r&d/.test(text)) return 'Research';
  return 'Engineering';
}

function DiscoverCrewCard({ crew, navigate, onJoin, isJoining, joined, onPreview }) {
  const isMember = !!crew.myRole || joined;
  const isFull = (crew.memberCount ?? 0) >= (crew.memberCap ?? 50);
  const isInviteOnly = crew.visibility === 'INVITE_ONLY';
  const fillPct = Math.min(100, Math.round(((crew.memberCount || 0) / (crew.memberCap || 50)) * 100));
  const categoryTag = useMemo(() => inferCategory(crew), [crew]);

  return (
    <motion.div variants={FADE_IN_UP}>
      <EntityCard
        type="discover"
        glyph={<span className="text-sm font-medium">{crew.name.slice(0, 2).toUpperCase()}</span>}
        name={crew.name}
        tagline={crew.description || 'No description provided.'}
        onClick={() => onPreview(crew)}
        showArrow
        badges={[<span key="cat" className="ec-badge ec-badge--ghost">{categoryTag}</span>]}
        meta={[
          { icon: <Users className="w-3 h-3" />, text: `${crew.memberCount ?? 0}/${crew.memberCap ?? 50} members` },
        ]}
        progress={fillPct}
        footer={
          <div className="ec-card-foot">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onPreview(crew); }} className="h-8 px-2 text-xs gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
            <AnimatePresence mode="wait">
              {isMember ? (
                <motion.button key="joined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/app/crews/${crew.id}`); }} className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-[var(--success)] hover:opacity-80 transition-opacity">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Open
                </motion.button>
              ) : isInviteOnly ? (
                <span className="flex items-center gap-1.5 px-3 h-8 text-xs text-[var(--text-muted)]"><Lock className="w-3.5 h-3.5" /> Invite only</span>
              ) : (
                <Button key="join" size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onJoin(crew.id); }} disabled={isJoining || isFull} className={cn('h-8 text-xs font-medium', isFull && 'opacity-60 cursor-not-allowed')}>
                  {isJoining ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining</> : isFull ? 'Full' : 'Join'}
                </Button>
              )}
            </AnimatePresence>
          </div>
        }
      />
    </motion.div>
  );
}

function CrewQuickPreviewModal({ crew, isOpen, onClose, onJoin, isJoining, isMember, navigate }) {
  if (!crew) return null;
  const isFull = (crew.memberCount ?? 0) >= (crew.memberCap ?? 50);
  const fillPct = Math.min(100, Math.round(((crew.memberCount || 0) / (crew.memberCap || 50)) * 100));
  
  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-lg bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-lg p-6">
        <ModalHeader>
          <ModalTitle className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium text-sm flex items-center justify-center shrink-0">
              {crew.name.slice(0, 2).toUpperCase()}
            </div>
            {crew.name}
          </ModalTitle>
          <ModalDescription className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
            {crew.description || 'No description available for this crew.'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[var(--text-secondary)]">{crew.memberCount ?? 0} of {crew.memberCap ?? 50} members</span>
              <span className="text-[var(--text-primary)]">{fillPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)]" style={{ width: `${fillPct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-center">
              <div className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{crew.projectCount ?? 0}</div>
              <Text variant="muted" size="xs">Projects</Text>
            </div>
            <div className="p-3 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-center">
              <div className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{crew.channelCount ?? 3}</div>
              <Text variant="muted" size="xs">Channels</Text>
            </div>
            <div className="p-3 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-center flex flex-col items-center justify-center">
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                {crew.visibility === 'INVITE_ONLY' ? (
                  <span className="inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5"/> Invite</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5"/> Public</span>
                )}
              </div>
              <Text variant="muted" size="xs">Visibility</Text>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-sm">Close</Button>
          {isMember ? (
            <Button variant="primary" onClick={() => { onClose(); navigate(`/app/crews/${crew.id}`); }} className="h-9 text-sm gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Open crew
            </Button>
          ) : (
            <Button variant="primary" onClick={() => { onJoin(crew.id); onClose(); }} disabled={isJoining || isFull} className="h-9 text-sm gap-1.5">
              {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
              {isFull ? 'Crew full' : 'Join crew'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function MemberAvatarStack({ count = 0 }) {
  const max = Math.min(count, 3);
  return (
    <div className="flex -space-x-2">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border-2 border-[var(--bg-card)] flex items-center justify-center text-[10px] text-[var(--text-secondary)] font-medium">
          <UserPlus className="w-3 h-3" />
        </div>
      ))}
      {count > max && (
        <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border-2 border-[var(--bg-card)] flex items-center justify-center text-[9px] text-[var(--text-secondary)] font-medium">
          +{count - max}
        </div>
      )}
    </div>
  );
}

export function CrewDiscoverPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewCrew, setPreviewCrew] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const { data: allCrews = [], isLoading, isFetching, isError, refetch } = useDiscoverCrews();
  const joinMutation = useJoinPublicCrew();

  const categoryCounts = useMemo(() => {
    if (!Array.isArray(allCrews)) return {};
    const counts = { All: allCrews.length };
    allCrews.forEach(c => {
      const cat = inferCategory(c);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allCrews]);

  const crews = useMemo(() => {
    if (!Array.isArray(allCrews)) return [];
    return allCrews.filter(c => {
      const q = keyword.toLowerCase().trim();
      const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const isMember = !!c.myRole;
      const isFull = (c.memberCount ?? 0) >= (c.memberCap ?? 50);
      if (filterTab === 'OPEN' && (isMember || isFull)) return false;
      if (filterTab === 'JOINED' && !isMember) return false;
      if (selectedCategory !== 'All' && inferCategory(c) !== selectedCategory) return false;
      return true;
    });
  }, [allCrews, keyword, filterTab, selectedCategory]);

  const trendingCrews = useMemo(() => {
    if (!Array.isArray(allCrews)) return [];
    return [...allCrews].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0)).slice(0, 4);
  }, [allCrews]);

  const featuredCrew = useMemo(() => (!Array.isArray(allCrews) || allCrews.length === 0) ? null : allCrews[0], [allCrews]);

  const totalOpenSeats = useMemo(() => {
    if (!Array.isArray(allCrews)) return 0;
    return allCrews.reduce((acc, c) => acc + Math.max(0, (c.memberCap || 50) - (c.memberCount || 0)), 0);
  }, [allCrews]);

  const pageState = isLoading ? 'loading' : isError ? 'error' : crews.length === 0 ? 'empty' : 'ready';

  return (
    <PageShell maxWidth="default">
      {isFetching && !isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-[var(--accent)]/40 overflow-hidden"><div className="h-full bg-[var(--accent)] animate-pulse w-full" /></div>
      )}
      {!isOnline && (
        <div className="flex items-center gap-2 py-2.5 px-3 text-sm text-[var(--warning)] mx-auto max-w-3xl" role="status" aria-live="polite">
          <WifiOff className="w-4 h-4 shrink-0" /><span>You're offline. Showing the last cached list of crews.</span>
        </div>
      )}

      <PageHero title="Discover crews" subtitle="Find teams across engineering, design, marketing, and product." eyebrow="">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-8 text-xs gap-1.5">
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} /> Refresh
        </Button>
      </PageHero>

      <EntityStatStrip stats={[
        { key: 'total', label: 'Available Crews', value: Array.isArray(allCrews) ? allCrews.length : 0, sublabel: 'Open to explore', icon: Users, tone: 'cyan' },
        { key: 'open', label: 'Open Seats', value: totalOpenSeats, sublabel: 'Across all crews', icon: UserPlus, tone: 'emerald' },
        { key: 'categories', label: 'Categories', value: categories.length - 1, sublabel: 'Mission types', icon: Layers, tone: 'amber' },
      ]} />

      <div className="w-full space-y-4 my-6">
        <EntityFilterBar
          search={keyword}
          onSearch={setKeyword}
          searchPlaceholder="Search crews by name or description"
          chips={[
            { id: 'ALL', label: 'All', count: Array.isArray(allCrews) ? allCrews.length : 0 },
            { id: 'OPEN', label: 'Open seats', count: (Array.isArray(allCrews) ? allCrews : []).filter(c => !c.myRole && ((c.memberCount ?? 0) < (c.memberCap ?? 50))).length },
            { id: 'JOINED', label: 'My crews', count: (Array.isArray(allCrews) ? allCrews : []).filter(c => !!c.myRole).length },
          ]}
          activeChip={filterTab}
          onChip={setFilterTab}
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar relative">
          {categories.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            const isSelected = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={isSelected}
                className={cn('relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0',
                  isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="discover-category-indicator"
                    className="absolute inset-0 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-full -z-10"
                    transition={SPRINGS.bouncy}
                  />
                )}
                {cat}
                {count > 0 && isSelected && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold">
                    {count}
                  </span>
                )}
                {count > 0 && !isSelected && (
                  <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <PageContent>
        <PageState state={pageState} moduleId="discover" stateProps={{ skeleton: <CrewDiscoverSkeleton />, loadingVariant: 'cards' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-4">
              {isError ? (
                <ErrorState title="Unable to load crews" description="There was a problem connecting to the crew service. Check your connection and try again."
                  action={<Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Try again</Button>} />
              ) : crews.length === 0 ? (
                <Surface variant="glass" radius="xl" className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
                    <Search className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <Heading level={3} className="text-base font-semibold text-[var(--text-primary)]">No crews found</Heading>
                  <Text variant="muted" className="text-sm max-w-sm mt-2 mb-5 leading-relaxed">
                    {keyword || selectedCategory !== 'All' || filterTab !== 'ALL' ? 'No crews match your search or filters.' : 'There are no public crews available yet.'}
                  </Text>
                  {(keyword || selectedCategory !== 'All' || filterTab !== 'ALL') && (
                    <Button variant="outline" size="sm" onClick={() => { setKeyword(''); setFilterTab('ALL'); setSelectedCategory('All'); }} className="h-8 text-xs gap-1.5">
                      <X className="w-3.5 h-3.5" /> Clear filters
                    </Button>
                  )}
                </Surface>
              ) : (
                <motion.div variants={STAGGER_FAST} initial="hidden" animate="show" className="ec-grid">
                  {crews.map(crew => (
                    <DiscoverCrewCard
                      key={crew.id}
                      crew={crew}
                      navigate={navigate}
                      onJoin={(id) => joinMutation.mutate(id)}
                      isJoining={joinMutation.isPending && joinMutation.variables === crew.id}
                      joined={joinMutation.isSuccess && joinMutation.variables === crew.id}
                      onPreview={(c) => setPreviewCrew(c)}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="hidden lg:flex lg:col-span-4 lg:flex-col gap-5">
              
              {featuredCrew && (
                <Surface variant="glass" radius="2xl" className="p-6 relative overflow-hidden group border border-[var(--border-subtle)]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 80% 20%, hsl(${hashHue(featuredCrew.name)} 70% 55% / 0.15), transparent 60%)`
                  }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> Featured Spotlight
                  </div>
                  <Heading level={3} className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-2">
                    {featuredCrew.name}
                  </Heading>
                  <Text variant="muted" className="text-sm line-clamp-3 leading-relaxed mb-5">
                    {featuredCrew.description || 'Join this crew and help drive its projects forward.'}
                  </Text>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <MemberAvatarStack count={featuredCrew.memberCount ?? 0} />
                    <Button variant="primary" size="sm" onClick={() => setPreviewCrew(featuredCrew)} className="text-xs h-8 px-3 font-medium shadow-sm hover:-translate-y-0.5 transition-transform">
                      Preview Mission
                    </Button>
                  </div>
                </Surface>
              )}

              <Surface variant="elevated" radius="xl" className="p-5 border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-[var(--warning)]" />
                  <Heading level={4} className="text-[11px] uppercase font-mono tracking-wider font-bold text-[var(--text-primary)]">Trending</Heading>
                </div>
                <div className="space-y-1">
                  {trendingCrews.map((crew, index) => {
                    const fillPct = Math.min(100, Math.round(((crew.memberCount || 0) / (crew.memberCap || 50)) * 100));
                    return (
                      <motion.div
                        key={crew.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setPreviewCrew(crew)} 
                        role="button" 
                        tabIndex={0} 
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreviewCrew(crew); } }} 
                        className="flex items-center gap-3 py-2.5 px-2 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg hover:bg-[var(--bg-hover)] hover:-translate-y-[1px] transition-all"
                      >
                        <div className="w-5 h-5 rounded-md bg-[var(--bg-subtle)] text-[10px] font-mono font-bold text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{crew.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{crew.memberCount ?? 0} members</div>
                        </div>
                        <div className="w-8 flex justify-end shrink-0">
                          <div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${fillPct}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {trendingCrews.length === 0 && <Text variant="muted" size="xs" className="py-4">No trending crews yet.</Text>}
                </div>
              </Surface>
            </div>
          </div>
        </PageState>
      </PageContent>

      <CrewQuickPreviewModal
        crew={previewCrew}
        isOpen={!!previewCrew}
        onClose={() => setPreviewCrew(null)}
        onJoin={(id) => joinMutation.mutate(id)}
        isJoining={joinMutation.isPending && joinMutation.variables === previewCrew?.id}
        isMember={!!previewCrew?.myRole}
        navigate={navigate}
      />
    </PageShell>
  );
}
export default CrewDiscoverPage;

function CrewDiscoverSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Surface key={i} variant="glass" className="p-5 h-[190px] flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
              </div>
              <div className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]"><Skeleton className="h-6 w-14 rounded" /><Skeleton className="h-6 w-16 rounded" /></div>
            </Surface>
          ))}
        </div>
      </div>
      <div className="hidden lg:block lg:col-span-4 space-y-5">
        <Surface variant="glass" radius="2xl" className="p-6 h-[200px]">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-6 w-40 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Surface>
        <Surface variant="elevated" radius="xl" className="p-5">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}