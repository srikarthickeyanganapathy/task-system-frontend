import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Share2, UserPlus, Github, Inbox, Clock3, CheckCircle2, XCircle,
  RotateCcw, Loader2, Unplug, RefreshCw, Link2, AlertCircle, UserMinus,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/Select'
import { useRealtime } from '@/app/providers/RealTimeProvider'
import {
  useCrewRepoShares, useShareCrewRepo, useUnshareCrewRepo,
  useCrewRepoInvitations, useProvisionRepoInvite, useCrewMembers,
  useRemoveCrewCollaborator,
} from '@/crew'
import { useGithubConfig, useRefreshGithubRepo, useGithubConnect } from '@/github'

/* ============================================================
   CrewRepoSharingPanel -- federated GitHub sharing for crew
   projects. Everything shown comes from real backend endpoints
   (repo-shares / repo-invitations / crew members / github config):
   - shares list + owner identity   -> GET repo-shares
   - collaborator invite status     -> GET repo-invitations
   - member GitHub connection       -> crew members (githubLogin)
   - invite provisioning            -> POST repo-invitations
   No fabricated states: a member without a GitHub connection is
   shown as such (backend cannot invite them - username-based API).
   ============================================================ */

const INVITE_CHIP = {
  PENDING: { label: 'Invite sent', icon: Clock3, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  ACCEPTED: { label: 'Joined', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  REMOVED: { label: 'Removed', icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

function InviteStatusChip({ status }) {
  const chip = INVITE_CHIP[status] || INVITE_CHIP.PENDING
  const Icon = chip.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-semibold',
      chip.className
    )}>
      <Icon className="w-3 h-3" /> {chip.label}
    </span>
  )
}

function MemberRow({ member, share, invite, myGithubLogin, canManage, invitePending, removePending, onInvite, onRemove }) {
  const isOwner = share && myGithubLogin && share.ownerGithubLogin === myGithubLogin
  const mayInvite = (isOwner || canManage) && member.githubLogin
  const isRepoOwner = share && member.userId === share.ownerUserId

  return (
    <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-[var(--bg-subtle)]/60 transition-colors">
      <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] shrink-0">
        {(member.username || '?').slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-medium text-[var(--text-primary)] truncate">{member.username}</span>
          {member.githubLogin && (
            <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">@{member.githubLogin}</span>
          )}
        </div>
        {!member.githubLogin && (
          <p className="text-[10.5px] text-[var(--text-muted)] flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" /> No GitHub connection -- cannot be invited yet
          </p>
        )}
      </div>
      {isRepoOwner ? (
        <Badge variant="outline" size="xs" className="shrink-0">Owner</Badge>
      ) : invite ? (
        <InviteStatusChip status={invite.status} />
      ) : (
        <span className="text-[10.5px] text-[var(--text-muted)] px-1">Not invited</span>
      )}
      {mayInvite && !isRepoOwner && invite?.status !== 'ACCEPTED' && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={invitePending || invite?.status === 'PENDING'}
          onClick={() => onInvite(share.repoFullName, member.userId)}
        >
          {invitePending ? <Loader2 className="w-3 h-3 animate-spin" /> : invite?.status === 'FAILED' ? <RotateCcw className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
          {invite?.status === 'PENDING' ? 'Invited' : invite?.status === 'FAILED' ? 'Retry' : 'Invite'}
        </Button>
      )}
      {/* The repo owner (the member who shared it) can revoke an accepted collaborator. */}
      {isOwner && invite?.status === 'ACCEPTED' && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--danger)]/10"
          disabled={removePending}
          onClick={() => onRemove(share.repoFullName, member.userId)}
        >
          {removePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3 mr-1" />}
          Remove
        </Button>
      )}
    </div>
  )
}

function ShareCard({ share, members, invitationsByRepo, myGithubLogin, canManage, onUnshare, onInvite, onRemove, invitePending, removePending }) {
  const [owner, repo] = share.repoFullName.split('/')
  const isOwner = myGithubLogin && share.ownerGithubLogin === myGithubLogin
  const repoInvites = invitationsByRepo.get(share.repoFullName) || new Map()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden"
    >
      {/* repo header */}
      <div className="flex items-center gap-3 px-3.5 py-3 border-b border-[var(--border-subtle)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
          <Github className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{repo}</span>
            <Badge variant="outline" size="xs" className="font-mono shrink-0">
              shared by @{share.ownerGithubLogin || 'unknown'}
            </Badge>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
            {owner}   shared {new Date(share.sharedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        {(isOwner || canManage) && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-[var(--text-muted)] hover:text-red-500"
            onClick={() => onUnshare(share.repoFullName)}
          >
            <Unplug className="w-3.5 h-3.5 mr-1" /> Unshare
          </Button>
        )}
      </div>

      {/* collaborator invites */}
      <div className="px-3.5 py-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
          <UserPlus className="w-3 h-3" /> Collaborator access
        </div>
        {members.length === 0 && (
          <p className="text-[12px] text-[var(--text-muted)] px-1 py-1">
            No crew members yet -- invite people to the crew first.
          </p>
        )}
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            share={share}
            invite={repoInvites.get(member.userId)}
            myGithubLogin={myGithubLogin}
            canManage={canManage}
            invitePending={invitePending}
            removePending={removePending}
            onInvite={onInvite}
            onRemove={onRemove}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function CrewRepoSharingPanel({ crewId, projectId, linkedRepos = [], canManage = false }) {
  const { data: config } = useGithubConfig()
  const { connected } = useRealtime()
  const myGithubLogin = config?.githubLogin

  const sharesQuery = useCrewRepoShares(crewId, projectId)
  const invitesQuery = useCrewRepoInvitations(crewId, projectId)
  const membersQuery = useCrewMembers(crewId)
  const shareMutation = useShareCrewRepo(crewId, projectId)
  const unshareMutation = useUnshareCrewRepo(crewId, projectId)
  const inviteMutation = useProvisionRepoInvite(crewId, projectId)
  const removeMutation = useRemoveCrewCollaborator(crewId, projectId)
  const refreshRepo = useRefreshGithubRepo()
  const connect = useGithubConnect()

  // Scope: ONLY the project's linked repos (the rail above). Ownership follows the
  // backend rule (isRepoOwner): the repo lives on an installation of the user's own
  // GitHub account - i.e. the repo's owner segment IS the user's login. We do NOT
  // use the mirror's permissionsJson here: that reflects the APP's permissions on
  // the repo (fine-grained grants), which can be false even for the owner.
  const [pickRepo, setPickRepo] = useState('')
  const shares = sharesQuery.data || []
  const members = membersQuery.data || []
  const sharedSet = useMemo(() => new Set(shares.map((s) => s.repoFullName)), [shares])
  const ownedSet = useMemo(() => {
    const owned = new Set()
    if (!myGithubLogin) return owned
    for (const fullName of linkedRepos) {
      const owner = fullName.split('/')[0]
      if (owner && owner.toLowerCase() === myGithubLogin.toLowerCase()) {
        owned.add(fullName.toLowerCase())
      }
    }
    return owned
  }, [linkedRepos, myGithubLogin])
  const shareable = linkedRepos.filter((fullName) => !sharedSet.has(fullName) && ownedSet.has(fullName.toLowerCase()))

  const invitationsByRepo = useMemo(() => {
    const map = new Map()
    for (const inv of invitesQuery.data || []) {
      if (!map.has(inv.repoFullName)) map.set(inv.repoFullName, new Map())
      map.get(inv.repoFullName).set(inv.inviteeUserId, inv)
    }
    return map
  }, [invitesQuery.data])

  const loading = sharesQuery.isLoading || membersQuery.isLoading
  const busy = shareMutation.isPending || unshareMutation.isPending
  const invitedCount = (invitesQuery.data || []).filter((i) => i.status === 'ACCEPTED').length

  const refreshLinked = () => {
    if (!linkedRepos.length) return
    Promise.all(linkedRepos.map((fullName) => refreshRepo.mutateAsync(fullName)))
      .then(() => toast.success('Linked repositories refreshed'))
      .catch(() => toast.error('Failed to refresh linked repositories'))
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/60 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)]/50 flex items-center justify-center shrink-0">
          <Share2 className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13.5px] font-semibold text-[var(--text-primary)]">Crew sharing</h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
            Federated access -- each member shares their <em className="not-italic text-[var(--text-secondary)]">own</em> repos and invites the rest as GitHub collaborators.
          </p>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10.5px] font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live
          </span>
        )}
      </div>

      {/* connect / sync gates -- real backend actions, not placeholders */}
      {!config?.appConfigured ? (
        <div className="mt-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-3.5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[var(--text-primary)]">GitHub is not configured for this workspace</p>
            <p className="text-[11.5px] text-[var(--text-muted)]">Crew sharing works per-member: each person connects their own GitHub account.</p>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5" onClick={() => connect.mutate()}>
            <Github className="w-3.5 h-3.5" /> Connect GitHub
          </Button>
        </div>
      ) : !config.connected ? (
        <div className="mt-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-3.5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[var(--text-primary)]">Connect your GitHub to share repos</p>
            <p className="text-[11.5px] text-[var(--text-muted)]">You can only share repositories you own ? connect to get started.</p>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5" onClick={() => connect.mutate()} isLoading={connect.isPending}>
            <Github className="w-3.5 h-3.5" /> Connect
          </Button>
        </div>
      ) : (
        <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-3.5 py-2.5">
          <span className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1.5 min-w-0">
            <Github className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            Connected as <span className="font-mono font-semibold text-[var(--text-primary)] truncate">@{myGithubLogin}</span>
          </span>
          <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-[var(--text-muted)]" onClick={refreshLinked} isLoading={refreshRepo.isPending}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh linked repos
          </Button>
        </div>
      )}

      {sharesQuery.isError && (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-red-500">Could not load crew shares.</span>
          <Button variant="outline" size="sm" onClick={() => sharesQuery.refetch()}>Retry</Button>
        </div>
      )}

      {/* shared repo list */}
      <div className="mt-3.5 space-y-2">
        <AnimatePresence initial={false}>
          {!loading && shares.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                <Inbox className="w-[18px] h-[18px] text-[var(--text-muted)]" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">Nothing shared with the crew yet</p>
              <p className="text-[12px] text-[var(--text-muted)] max-w-[320px]">
                Link a repository above, then share one of your own repos -- crew members get access instantly, no hub, no central account.
              </p>
            </motion.div>
          )}
          {shares.map((share) => (
            <ShareCard
              key={share.repoFullName}
              share={share}
              members={members}
              invitationsByRepo={invitationsByRepo}
              myGithubLogin={myGithubLogin}
              canManage={canManage}
              invitePending={inviteMutation.isPending}
              onUnshare={(fullName) => unshareMutation.mutate(fullName)}
              onInvite={(repoFullName, inviteeUserId) => inviteMutation.mutate({ repoFullName, inviteeUserId })}
              onRemove={(repoFullName, inviteeUserId) => removeMutation.mutate({ repoFullName, inviteeUserId })}
              removePending={removeMutation.isPending}
            />
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading crew shares...
          </div>
        )}
      </div>

      {/* share picker -- ANY connected member shares their OWN repos */}
      {config?.connected && shareable.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-3 py-2.5">
          <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          <div className="flex-1 min-w-[180px]">
            <Select value={pickRepo} onValueChange={setPickRepo}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue placeholder="Share a repo you own with the crew..." />
              </SelectTrigger>
              <SelectContent>
                {shareable.map((fullName) => (
                  <SelectItem key={fullName} value={fullName}>{fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            disabled={!pickRepo || busy}
            onClick={() => shareMutation.mutate(pickRepo, { onSuccess: () => setPickRepo('') })}
          >
            {shareMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
            Share
          </Button>
        </div>
      )}
      {config?.connected && shareable.length === 0 && shares.length > 0 && (
        <p className="mt-3 text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> All repos you own are shared with the crew.
        </p>
      )}
      {config?.connected && shareable.length === 0 && shares.length === 0 && linkedRepos.length === 0 && (
        <p className="mt-3 text-[11.5px] text-[var(--text-muted)]">
          Link a repository first, then it becomes shareable here.
        </p>
      )}
      {config?.connected && shareable.length === 0 && shares.length === 0 && linkedRepos.length > 0 && (
        <p className="mt-3 text-[11.5px] text-[var(--text-muted)]">
          You don't own any of the linked repos -- only the owner of a repo can share it.
        </p>
      )}
      {!config?.connected && (
        <p className="mt-3 text-[11.5px] text-[var(--text-muted)]">
          Connect your GitHub account to share repos you own with the crew.
        </p>
      )}

      {/* real progress signal */}
      {invitedCount > 0 && (
        <p className="mt-3 text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {invitedCount} collaborator{invitedCount === 1 ? '' : 's'} accepted their GitHub invite.
        </p>
      )}
    </motion.section>
  )
}
