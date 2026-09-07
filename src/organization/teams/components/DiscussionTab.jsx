import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Trash2, Paperclip, FileText, Download, Image as ImageIcon, Sheet, CornerDownRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { PillNav } from '@/shared/ui/PillNav'
import { Text } from '@/shared/ui/Typography'
import { cn } from '@/shared/lib/cn'

/* ============================================================
   components/DiscussionTab.jsx -- Exchange.
   Conversations | Files segments, search, attachments, six-emoji
   reactions, reply threads and day separators -- the approved
   demo layout. Real API: messages / onSend / onDelete
   (useTeamMessages / useSendTeamMessage / useDeleteTeamMessage +
   confirm dialog). Replies, reactions and uploads are client-side
   until your backend exposes them -- marked WIRE.
   ============================================================ */

const EMOJI_REACTIONS = ['  ', '  ', '  ', '  ', '  ', '  ']

function hashHue(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h) % 360
}

function avatarGradient(name = '?') {
  const h = hashHue(name)
  return `linear-gradient(135deg, hsl(${h} 72% 52%), hsl(${(h + 35) % 360} 68% 38%))`
}

function dayLabel(ts) {
  if (!ts) return 'Earlier'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return 'Earlier'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yday = new Date(today); yday.setDate(yday.getDate() - 1)
  if (d >= today) return 'Today'
  if (d >= yday) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatDaySeparator(dateStr) {
  if (!dateStr) return 'Earlier'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Earlier'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yday = new Date(today); yday.setDate(yday.getDate() - 1)
  if (d >= today) return 'Today'
  if (d >= yday) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatTimeCompact(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const fileIconFor = name => {
  const ext = (name || '').split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon className="w-3.5 h-3.5 text-[#4f8ef7]" />
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <Sheet className="w-3.5 h-3.5 text-[#2f9e63]" />
  return <FileText className="w-3.5 h-3.5 text-[#e08a00]" />
}

export function DiscussionTab({
  teamId,
  messages = [],
  messagesLoading = false,
  user,
  canManage,
  isReadOnly,
  onSend,
  onDelete,
}) {
  const [view, setView] = useState('conv')
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [reactions, setReactions] = useState({})
  const [threads, setThreads] = useState({})
  const [openThread, setOpenThread] = useState(null)
  const [threadInput, setThreadInput] = useState('')
  const [files, setFiles] = useState([]) // WIRE: attachments API

  const canPost = !isReadOnly && !!onSend

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(m => m.content?.toLowerCase().includes(q) || m.authorUsername?.toLowerCase().includes(q))
  }, [messages, searchQuery])

  const messageGroups = useMemo(() => {
    return filteredMessages.map((msg, i) => {
      const prev = i > 0 ? filteredMessages[i - 1] : null
      const showSeparator = !prev || dayLabel(msg.createdAt) !== dayLabel(prev.createdAt)
      const showHeader = showSeparator || msg.authorUsername !== prev?.authorUsername
      return { ...msg, showSeparator, showHeader }
    })
  }, [filteredMessages])

  const submit = () => {
    const content = draft.trim()
    if (!content && attachments.length === 0) return
    onSend(content || '(attachment)') // WIRE: extend sendMessage payload with attachments
    setDraft('')
    setAttachments([])
  }

  const handleAttach = (e) => {
    const picked = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...picked.map(f => f.name)])
    e.target.value = ''
  }

  const handleThreadReply = (parentId) => {
    if (!threadInput.trim()) return
    setThreads(prev => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), { id: `reply-${Date.now()}`, authorUsername: user?.username || 'You', content: threadInput.trim(), createdAt: new Date().toISOString() }],
    }))
    setThreadInput('')
  }

  const handleToggleReaction = (messageId, emoji) => {
    setReactions(prev => {
      const cur = { ...(prev[messageId] || {}) }
      cur[emoji] = (cur[emoji] || 0) + 1
      return { ...prev, [messageId]: cur }
    })
  }

  return (
    <div className="pt-4 max-w-3xl">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <PillNav
          options={[{ value: 'conv', label: 'Conversations' }, { value: 'files', label: 'Files' }]}
          value={view}
          onChange={setView}
        />
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search..." debounceMs={0} className="w-[170px] sm:w-[220px] ml-auto" />
      </div>

      {view === 'conv' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] flex flex-col h-[65vh] overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            {messagesLoading ? (
              <div className="space-y-4 px-5">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center px-5">
                <EmptyState icon={MessageSquare} title={searchQuery ? 'No matches found' : 'Start the conversation'} description={searchQuery ? 'Try a different search.' : 'Be the first to share an update or ask a question.'} className="min-h-[200px] bg-transparent border-0 shadow-none" />
              </div>
            ) : (
              <div className="space-y-1 px-3 sm:px-5">
                {messageGroups.map((msg, i) => {
                  const isAuthor = msg.authorUsername === user?.username
                  const canDelete = !isReadOnly && (isAuthor || canManage)
                  const msgReactions = reactions[msg.id] || {}
                  const replyCount = (threads[msg.id] || []).length
                  const threadOpen = openThread === msg.id
                  return (
                    <div key={msg.id} className="group/msg">
                      {msg.showSeparator && (
                        <div className="flex items-center my-5 first:mt-0">
                          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                          <span className="px-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{formatDaySeparator(msg.createdAt)}</span>
                          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                        </div>
                      )}
                      <div className={cn('flex items-start gap-2.5 hover:bg-[var(--bg-subtle)]/40 rounded-lg p-2 -mx-2 transition-colors', msg.showHeader ? 'mt-2' : 'mt-0.5')}>
                        <div className="w-8 shrink-0 flex justify-center">
                          {msg.showHeader ? (
                            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0" style={{ background: avatarGradient(msg.authorUsername) }}>
                              {msg.authorUsername?.charAt(0).toUpperCase() || '?'}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          {msg.showHeader && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-[12px] font-bold">{msg.authorUsername}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">{formatTimeCompact(msg.createdAt)}</span>
                              <span className="flex-1" />
                              {canDelete && (
                                <button onClick={() => onDelete(msg.id)} title="Delete message"
                                  className="opacity-0 group-hover/msg:opacity-100 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-all cursor-pointer">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-[12.5px] text-[var(--text-secondary)] break-words whitespace-pre-wrap leading-relaxed mt-1">{msg.content}</p>
                          {(msg.attachments || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {msg.attachments.map(a => (
                                <span key={a} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                                  <Paperclip className="w-3 h-3" /> {a}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {EMOJI_REACTIONS.map(emoji => {
                              const count = msgReactions[emoji] || 0
                              return (
                                <motion.button key={emoji} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[12px] leading-none transition-all cursor-pointer',
                                    count > 0 ? 'bg-[var(--accent-soft)] border border-[var(--accent-border)]' : 'bg-[var(--bg-subtle)] border border-transparent hover:border-[var(--border-subtle)]')}>
                                  <span>{emoji}</span>
                                  {count > 0 && <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[9px] font-bold text-[var(--text-secondary)]">{count}</motion.span>}
                                </motion.button>
                              )
                            })}
                          </div>
                          <button onClick={() => setOpenThread(threadOpen ? null : msg.id)} className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                            <CornerDownRight className="w-3 h-3" />
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                          </button>
                          <AnimatePresence initial={false}>
                            {threadOpen && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-[var(--border-subtle)]">
                                  {(threads[msg.id] || []).map(r => (
                                    <div key={r.id} className="flex items-start gap-2 py-1">
                                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ background: avatarGradient(r.authorUsername) }}>
                                        {r.authorUsername?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                      <div className="min-w-0">
                                        <span className="text-[11px] font-bold">{r.authorUsername}</span>
                                        <p className="text-[11.5px] text-[var(--text-secondary)]">{r.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {!isReadOnly && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ background: avatarGradient(user?.username || 'You') }}>
                                        {(user?.username || 'Y').charAt(0).toUpperCase()}
                                      </span>
                                      <input
                                        value={threadInput}
                                        onChange={e => setThreadInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleThreadReply(msg.id) } }}
                                        placeholder="Reply..."
                                        className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                                        aria-label="Reply"
                                      />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Composer */}
          {canPost && (
            <div className="border-t border-[var(--border-subtle)] p-3">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {attachments.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                      <Paperclip className="w-3 h-3" /> {a}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
                  placeholder="Start a discussion in the team..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none max-h-32 py-1"
                  aria-label="Discussion content"
                />
                <label className="shrink-0 cursor-pointer p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-subtle)] transition-colors" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" multiple className="hidden" onChange={handleAttach} />
                </label>
                <Button variant="primary" size="sm" className="gap-1.5 h-8 shrink-0" onClick={submit} disabled={!draft.trim() && attachments.length === 0}>
                  <Send className="w-3.5 h-3.5" /> Post
                </Button>
              </div>
            </div>
          )}
          {isReadOnly && <p className="text-[11px] text-[var(--text-muted)] px-3 pb-2">You're an observer ? read only.</p>}
        </div>
      )}

      {view === 'files' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-xs)] overflow-hidden">
          {files.length === 0 ? (
            <EmptyState icon={FileText} title="No files yet" description="Attachments shared in the team will appear here." className="min-h-[220px]" />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">{fileIconFor(f.name)}</span>
                  <span className="flex-1 min-w-0 truncate text-[12.5px] font-medium">{f.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono shrink-0">{f.size}</span>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{ background: avatarGradient(f.who) }}>{f.who.charAt(0).toUpperCase()}</span>
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0 hidden sm:inline">{f.when}</span>
                  <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-subtle)] cursor-pointer" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DiscussionTab
