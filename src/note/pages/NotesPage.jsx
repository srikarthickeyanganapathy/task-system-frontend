import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, isToday, isSameDay } from 'date-fns'
import {
  Pin, Plus, Trash2, Search, Calendar, FileText, Clock,
  Sparkles, Hash, ArrowUpDown, Layers, CheckCircle2,
  Lightbulb, BookOpen, Archive, LayoutGrid, List as ListIcon,
  PenLine, Check, Timer, CornerDownLeft, Tag, X, Code, Quote,
  CheckSquare
} from '@/shared/ui/Icons'
import { Button, IconButton } from '@/shared/ui/Button'
import { Heading, Text } from '@/shared/ui/Typography'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Badge } from '@/shared/ui/Badge'
import { cn } from '@/shared/lib/cn'
import { useNotes, useDeleteNote, useUpdateNote, useCreateNote, NotePanel } from '@/note'
import { noteDna } from '../entities/model/dna'
import { PageShell, PageHero, PageToolbar, PageContent } from '@/shared/ui/PageShell'
import { PageState } from '@/shared/ui/PageState'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { InteractiveCard } from '@/shared/ui/InteractiveCard'
import { useWorkspace } from '@/app/providers/WorkspaceProvider'
import { useSEO } from '@/shared/seo'

const COLOR_THEMES = {
  default: {
    bg: 'var(--bg-elevated)', glow: 'transparent', accent: 'var(--accent)',
    chip: 'var(--bg-subtle)', border: 'var(--border-subtle)',
    dotColor: 'var(--text-tertiary)',
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.04)', glow: 'rgba(245, 158, 11, 0.12)', accent: '#F59E0B',
    chip: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)',
    dotColor: '#F59E0B',
  },
  rose: {
    bg: 'rgba(244, 63, 94, 0.04)', glow: 'rgba(244, 63, 94, 0.12)', accent: '#F43F5E',
    chip: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.25)',
    dotColor: '#F43F5E',
  },
  sky: {
    bg: 'rgba(14, 165, 233, 0.04)', glow: 'rgba(14, 165, 233, 0.12)', accent: '#0EA5E9',
    chip: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.25)',
    dotColor: '#0EA5E9',
  },
  violet: {
    bg: 'rgba(139, 92, 246, 0.04)', glow: 'rgba(139, 92, 246, 0.12)', accent: '#8B5CF6',
    chip: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)',
    dotColor: '#8B5CF6',
  },
}

const SORT_OPTIONS = [
  { id: 'updated', label: 'Last Updated', icon: Clock },
  { id: 'created', label: 'Date Created', icon: Calendar },
  { id: 'title', label: 'Title A-Z', icon: Hash },
  { id: 'words', label: 'Word Count', icon: FileText },
]

const FRESHNESS_COLORS = {
  fresh: 'var(--success)',
  recent: 'var(--warning)',
  old: 'var(--text-tertiary)',
}

const TYPE_META = {
  text: { label: 'Text', color: 'var(--text-secondary)' },
  checklist: { label: 'Checklist', color: 'var(--success)' },
  code: { label: 'Code', color: 'var(--accent)' },
  quote: { label: 'Quote', color: 'var(--warning)' },
}

function detectType(content) {
  const c = content || ''
  if (/^[-*]\s+\[[ xX]\]\s+/m.test(c)) return 'checklist'
  if (c.includes('```')) return 'code'
  if (/^>\s/m.test(c)) return 'quote'
  return 'text'
}

function MiniMarkdownPreview({ content, maxLines = 3 }) {
  const preview = useMemo(() => {
    if (!content?.trim()) return []
    const lines = content.split('\n').slice(0, maxLines * 2)
    const result = []
    for (const line of lines) {
      if (result.length >= maxLines) break
      if (!line.trim()) continue
      if (line.startsWith('```')) continue
      if (line.startsWith('# ')) { result.push({ type: 'h1', text: line.replace('# ', '') }); continue }
      if (line.startsWith('## ')) { result.push({ type: 'h2', text: line.replace('## ', '') }); continue }
      if (line.startsWith('### ')) { result.push({ type: 'h3', text: line.replace('### ', '') }); continue }
      if (line.startsWith('> ')) { result.push({ type: 'quote', text: line.replace('> ', '') }); continue }
      if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) { result.push({ type: 'todo', text: line.replace(/^[-*]\s+\[ \]\s+/, ''), done: false }); continue }
      if (line.startsWith('- [x] ') || line.startsWith('* [x] ')) { result.push({ type: 'todo', text: line.replace(/^[-*]\s+\[x\]\s+/, ''), done: true }); continue }
      if (line.startsWith('- ') || line.startsWith('* ')) { result.push({ type: 'bullet', text: line.replace(/^[-*]\s+/, '') }); continue }
      result.push({ type: 'text', text: line })
    }
    return result
  }, [content, maxLines])

  if (preview.length === 0) {
    return <span className="text-[12px] italic text-[var(--text-tertiary)]">Empty note — click to start writing...</span>
  }

  const formatInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="space-y-1">
      {preview.map((line, i) => {
        switch (line.type) {
          case 'h1':
          case 'h2':
            return <div key={i} className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{formatInline(line.text)}</div>
          case 'h3':
            return <div key={i} className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide truncate">{formatInline(line.text)}</div>
          case 'quote':
            return <div key={i} className="text-[12px] italic text-[var(--text-secondary)] border-l-2 border-[var(--accent)] pl-2 truncate">{formatInline(line.text)}</div>
          case 'todo':
            return (
              <div key={i} className={cn("flex items-center gap-1.5 text-[12px]", line.done ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-secondary)]")}>
                <span className={cn("w-3 h-3 rounded border shrink-0 flex items-center justify-center", line.done ? "bg-[var(--success)] border-[var(--success)]" : "border-[var(--border-default)]")}>
                  {line.done && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="truncate min-w-0">{formatInline(line.text)}</span>
              </div>
            )
          case 'bullet':
            return (
              <div key={i} className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                <span className="truncate min-w-0">{formatInline(line.text)}</span>
              </div>
            )
          default:
            return <div key={i} className="text-[12px] text-[var(--text-secondary)] truncate leading-relaxed">{formatInline(line.text)}</div>
        }
      })}
    </div>
  )
}

/**
 * CaptureStrip Component
 * Upgraded quick capture with template action chips and smooth expand animation.
 */
function CaptureStrip({ onCreate, isCreating }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const type = detectType(content)
  const typeMeta = TYPE_META[type]
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed) return
    const fallbackTitle = trimmed.split('\n')[0]?.replace(/^[#>*\s-]+/, '').replace(/^\[[ xX]\]\s*/, '').slice(0, 60) || 'Untitled Note'
    onCreate({
      title: title.trim() || fallbackTitle,
      content: trimmed,
      color: 'default',
      isPinned: false,
    })
    setTitle('')
    setContent('')
    setOpen(false)
  }, [title, content, onCreate])

  const insertTemplate = (prefix) => {
    setContent(prev => prev ? `${prev}\n${prefix}` : prefix)
    textareaRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape' && open) {
      setOpen(false)
      setTitle('')
      setContent('')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 h-12 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/20 transition-all duration-200 group cursor-text shadow-xs"
      >
        <div className="w-7 h-7 rounded-xl bg-[var(--bg-subtle)] group-hover:bg-[var(--accent-soft)] flex items-center justify-center transition-colors">
          <PenLine className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" strokeWidth={1.75} />
        </div>
        <span className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-medium">
          Quick capture — jot a thought, checklist, or spec...
        </span>
        <span className="ml-auto hidden sm:flex items-center gap-1 text-[11px] font-mono text-[var(--text-tertiary)]">
          <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">Enter</kbd>
          <span>to open</span>
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] overflow-hidden transition-all duration-200">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Note title (auto-detected if blank)"
        className="w-full px-5 py-3 bg-transparent text-[14px] font-semibold tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] focus:outline-none"
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Start typing your note... Use `- [ ]` for checklist, ` ``` ` for code, `>` for quotes"
        rows={3}
        className="w-full px-5 py-3 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none resize-none leading-relaxed"
      />

      {/* Formatting & Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* Detected Type Pill */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono border"
            style={{ backgroundColor: `${typeMeta.color}12`, borderColor: `${typeMeta.color}30`, color: typeMeta.color }}
          >
            {type === 'checklist' && <CheckCircle2 className="w-3 h-3" />}
            {type === 'code' && <Hash className="w-3 h-3" />}
            {type === 'quote' && <Lightbulb className="w-3 h-3" />}
            {type === 'text' && <FileText className="w-3 h-3" />}
            {typeMeta.label}
          </span>

          {wordCount > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-tertiary)] px-1">
              {wordCount} words
            </span>
          )}

          {/* Quick template helpers */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => insertTemplate('- [ ] ')}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              <CheckSquare className="w-2.5 h-2.5" /> Checklist
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('```\n\n```')}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              <Code className="w-2.5 h-2.5" /> Code
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('> ')}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              <Quote className="w-2.5 h-2.5" /> Quote
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] text-[var(--text-tertiary)] font-mono">
            <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">Esc</kbd> to close
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-[var(--text-secondary)]"
            onClick={() => { setOpen(false); setTitle(''); setContent('') }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1 font-semibold"
            onClick={submit}
            disabled={isCreating || !content.trim()}
            isLoading={isCreating}
          >
            <CornerDownLeft className="w-3 h-3" /> Capture
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * NoteCard Component
 * Equalized height, structured flex layout, pinned footer with tags, and clean integrated pin badge.
 * Memoized to eliminate unnecessary re-renders during filter, sort, or typing updates.
 */
const NoteCard = React.memo(function NoteCard({ note, onOpen, onDelete, onTogglePin, isPinnedSection, onSelectTag }) {
  const theme = COLOR_THEMES[note.color] || COLOR_THEMES.default
  const dna = noteDna(note)
  const updatedDate = useMemo(() => {
    if (!note.updatedAt) return null
    const d = new Date(note.updatedAt)
    const now = new Date()
    const diffH = (now - d) / (1000 * 60 * 60)
    if (diffH < 1) return 'Just now'
    if (diffH < 24) return `${Math.floor(diffH)}h ago`
    if (diffH < 48) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }, [note.updatedAt])

  return (
    <InteractiveCard
      onClick={() => onOpen(note)}
      aria-label={`Open note: ${note.title || 'Untitled Note'}`}
      className={cn(
        'group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-default)] hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between p-4 sm:p-5'
      )}
    >
      {/* Top Header: Pill + Title + Actions */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className="w-1.5 h-4 rounded-full shrink-0"
              style={{ backgroundColor: theme.accent }}
            />
            <Heading
              level={4}
              className="line-clamp-1 text-[14px] sm:text-[15px] font-bold tracking-tight text-[var(--text-primary)]"
            >
              {note.title || 'Untitled Note'}
            </Heading>
            {note.isPinned && (
              <span className="w-4 h-4 rounded-full bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                <Pin className="w-2.5 h-2.5 fill-[var(--accent)] text-[var(--accent)]" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Freshness indicator dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0 mr-1"
              style={{ backgroundColor: FRESHNESS_COLORS[dna.freshness] }}
              title={dna.freshness === 'fresh' ? 'Edited recently' : dna.freshness === 'recent' ? 'Edited this week' : 'Older note'}
            />
            <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onTogglePin(note) }}
                className="w-6 h-6 hover:bg-[var(--bg-subtle)]"
                title={note.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={cn('w-3 h-3', note.isPinned ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-tertiary)]')} />
              </IconButton>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e) => onDelete(e, note.id)}
                className="w-6 h-6 hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="min-h-[48px] mb-3">
          <MiniMarkdownPreview content={note.content} maxLines={3} />
        </div>

        {/* Checklist Progress Bar (if applicable) */}
        {dna.hasChecklist && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1 font-semibold text-[var(--success)]">
                <CheckCircle2 className="w-3 h-3" /> {dna.checklistDone}/{dna.checklistTotal} done
              </span>
              <span>{dna.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
                style={{ width: `${dna.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pinned Footer: Tags + Stats */}
      <div className="mt-auto pt-3 border-t border-[var(--border-subtle)]/60 flex flex-col gap-2">
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {note.tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectTag?.(tag)
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono border hover:scale-105 transition-all"
                style={{ backgroundColor: theme.chip, borderColor: theme.border, color: theme.accent }}
              >
                <Tag className="w-2 h-2" />
                {tag}
              </button>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom Metadata: words, read time, updated */}
        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span className="tabular-nums">{dna.words}w</span>
            </span>
            {dna.words > 0 && (
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                <span>{dna.readingMinutes}m</span>
              </span>
            )}
          </div>
          {updatedDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {updatedDate}
            </span>
          )}
        </div>
      </div>
    </InteractiveCard>
  )
})

/**
 * StreamDay Component
 * Responsive timeline without brittle hardcoded pixel positions.
 * Memoized to avoid timeline re-renders when other days or notes change.
 */
const StreamDay = React.memo(function StreamDay({ group, onOpen, onDelete, onTogglePin }) {
  const words = group.notes.reduce((acc, n) => acc + (noteDna(n).words || 0), 0)

  return (
    <div className="mb-6">
      {/* Date Header Strip */}
      <div className="sticky top-0 z-10 flex items-center gap-2.5 py-2 bg-[var(--bg-base)]/90 backdrop-blur-md mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
        <span className="text-[13px] font-bold text-[var(--text-primary)] tracking-tight">
          {group.label}
        </span>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)] tabular-nums">
          {group.notes.length} note{group.notes.length !== 1 ? 's' : ''} • {words.toLocaleString()} words
        </span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>

      {/* Timeline Notes List */}
      <div className="space-y-2.5 pl-4 border-l-2 border-[var(--border-subtle)] ml-1">
        {group.notes.map((note) => {
          const theme = COLOR_THEMES[note.color] || COLOR_THEMES.default
          const dna = noteDna(note)

          return (
            <InteractiveCard
              key={note.id}
              variant="flat"
              onClick={() => onOpen(note)}
              aria-label={`Open note: ${note.title || 'Untitled Note'}`}
              className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)] group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-7 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold tracking-tight text-[var(--text-primary)] truncate">
                      {note.title || 'Untitled Note'}
                    </span>
                    {note.isPinned && (
                      <Pin className="w-3 h-3 fill-[var(--accent)] text-[var(--accent)] shrink-0" />
                    )}
                    {dna.hasChecklist && (
                      <span
                        className="shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border"
                        style={{ backgroundColor: theme.chip, borderColor: theme.border, color: theme.accent }}
                      >
                        {dna.checklistDone}/{dna.checklistTotal}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">
                    {note.content
                      ? note.content.replace(/^[-*]\s+\[[ xX]\]\s+/gm, '').replace(/[#>*`]/g, '').split('\n').find(l => l.trim())?.slice(0, 90) || 'Empty note'
                      : 'Empty note'}
                  </div>
                </div>

                <span className="shrink-0 text-[11px] font-mono tabular-nums text-[var(--text-tertiary)] hidden sm:block">
                  {note.updatedAt ? format(new Date(note.updatedAt), 'h:mm a') : ''}
                </span>

                <div className="shrink-0 flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onTogglePin(note) }}
                    className="w-6 h-6"
                    title="Pin"
                  >
                    <Pin className={cn('w-3 h-3', note.isPinned ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-tertiary)]')} />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => onDelete(e, note.id)}
                    className="w-6 h-6 hover:text-[var(--danger)]"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </IconButton>
                </div>
              </div>
            </InteractiveCard>
          )
        })}
      </div>
    </div>
  )
})

function NoteSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[210px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 flex flex-col justify-between animate-pulse"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 rounded-full bg-[var(--bg-subtle)]" />
              <div className="h-4 w-2/3 bg-[var(--bg-subtle)] rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-[var(--bg-subtle)] rounded" />
              <div className="h-2.5 w-4/5 bg-[var(--bg-subtle)] rounded" />
              <div className="h-2.5 w-3/5 bg-[var(--bg-subtle)] rounded" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
            <div className="h-2.5 w-14 bg-[var(--bg-subtle)] rounded" />
            <div className="h-2.5 w-12 bg-[var(--bg-subtle)] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function NotesEmptyState({ searchQuery, onAction, hasFilters }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-subtle)]/30">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-[var(--text-tertiary)]" />
        </div>
        <Heading level={3} className="text-[16px] font-bold tracking-tight mb-1.5 text-[var(--text-primary)]">
          No notes match your filters
        </Heading>
        <Text className="text-[13px] text-[var(--text-secondary)] max-w-sm mb-5 leading-relaxed">
          Try a different search keyword or clear selected tags to see all notes.
        </Text>
        <Button variant="outline" size="sm" onClick={onAction} className="h-8 text-[12px] gap-1.5">
          <Archive className="w-3.5 h-3.5" /> Clear Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-subtle)]/30">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7 text-[var(--accent)]" />
      </div>
      <Heading level={3} className="text-[18px] font-bold tracking-tight mb-2 text-[var(--text-primary)]">
        Your workspace notebook
      </Heading>
      <Text className="text-[13px] text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
        Capture ideas, draft specs, keep checklists, or jot down meeting notes.
        Everything stays private to your workspace.
      </Text>
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-md">
        {[
          { icon: CheckCircle2, label: 'Project checklist', color: 'var(--success)' },
          { icon: BookOpen, label: 'Meeting notes', color: 'var(--info)' },
          { icon: Lightbulb, label: 'Brainstorm dump', color: 'var(--warning)' },
          { icon: Hash, label: 'Code snippet', color: 'var(--accent)' },
        ].map((chip) => (
          <button
            key={chip.label}
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/30 transition-all text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] cursor-pointer group"
          >
            <chip.icon className="w-3 h-3" style={{ color: chip.color }} />
            {chip.label}
          </button>
        ))}
      </div>
      <Button onClick={onAction} size="sm" className="h-9 text-[13px] gap-2 font-semibold">
        <Plus className="w-4 h-4" />
        Create First Note
      </Button>
    </div>
  )
}

/* Workspace scope helpers */
function useNoteScope() {
  const { workspaceMode, activeOrganization, activeCrew } = useWorkspace()
  if (workspaceMode === 'ORG' && activeOrganization?.id) return { orgId: activeOrganization.id }
  if (workspaceMode === 'CREWS' && activeCrew?.id) return { crewId: activeCrew.id }
  return {}
}

const WORKSPACE_EYEBROW = {
  PERSONAL: 'Personal Notes',
  ORG: (org) => `Organization • ${org?.name || 'Selected Organization'}`,
  CREWS: (crew) => `Crew • ${crew?.name || 'Selected Crew'}`,
}

export function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const scope = useNoteScope()
  const { workspaceMode, activeOrganization, activeCrew } = useWorkspace()

  useSEO({
    title: 'Notes & Documentation',
    description: 'Capture ideas, draft specs, manage checklists, and organize workspace documentation.',
    ogTitle: 'Notes | Ryokai',
    noindex: true,
  })

  const { data: notes = [], isLoading } = useNotes(scope)
  const deleteNote = useDeleteNote()
  const updateNote = useUpdateNote()
  const createNote = useCreateNote(scope)
  const { confirm, dialog } = useConfirmDialog()

  const [searchQuery, setSearchQuery] = useState('')
  // React 19 deferred value for 60fps input responsiveness
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedTag, setSelectedTag] = useState(null)
  const [sortBy, setSortBy] = useState('updated')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [gardenMode, setGardenMode] = useState(() => searchParams.get('view') === 'stream' ? 'stream' : 'canvas')
  const [activeNote, setActiveNote] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const setMode = (mode) => {
    setGardenMode(mode)
    setSearchParams(params => { params.set('view', mode); return params }, { replace: true })
  }

  const handleDeleteNote = useCallback(async (e, noteId) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: 'Delete Note?',
      description: 'Are you sure you want to delete this note? This action cannot be undone.',
      danger: true,
      confirmLabel: 'Delete Note',
    })
    if (confirmed) deleteNote.mutate(noteId)
  }, [confirm, deleteNote])

  const handleCreate = useCallback((payload) => createNote.mutate(payload), [createNote])
  const openNew = useCallback(() => { setActiveNote(null); setIsPanelOpen(true) }, [])
  const openEdit = useCallback((note) => { setActiveNote(note); setIsPanelOpen(true) }, [])
  const togglePin = useCallback((note) => updateNote.mutate({ id: note.id, payload: { ...note, isPinned: !note.isPinned } }), [updateNote])
  const handleSelectTag = useCallback((t) => setSelectedTag(t), [])

  const closePanel = () => {
    setIsPanelOpen(false)
    setActiveNote(null)
    if (searchParams.has('openNoteId')) {
      setSearchParams(params => { params.delete('openNoteId'); return params }, { replace: true })
    }
  }

  const openNoteId = searchParams.get('openNoteId')
  useEffect(() => {
    if (openNoteId && notes?.length > 0) {
      const targetNote = notes.find(n => String(n.id) === String(openNoteId))
      if (targetNote && (!activeNote || activeNote.id !== targetNote.id)) {
        queueMicrotask(() => { setActiveNote(targetNote); setIsPanelOpen(true) })
      }
    }
  }, [openNoteId, notes, activeNote])

  // Extract all unique tags in the current notebook
  const allTags = useMemo(() => {
    const set = new Set()
    for (const n of notes) {
      if (Array.isArray(n.tags)) {
        for (const t of n.tags) {
          if (t && typeof t === 'string') set.add(t)
        }
      }
    }
    return Array.from(set).sort()
  }, [notes])

  // Filter notes by deferred search query and active tag for non-blocking 60fps search
  const filteredNotes = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase()
    return notes.filter(n => {
      // Tag filter
      if (selectedTag && !(n.tags || []).includes(selectedTag)) return false
      // Search filter
      if (q) {
        const matchesTitle = n.title?.toLowerCase().includes(q)
        const matchesContent = n.content?.toLowerCase().includes(q)
        const matchesTags = (n.tags || []).some(t => t.toLowerCase().includes(q))
        if (!matchesTitle && !matchesContent && !matchesTags) return false
      }
      return true
    })
  }, [notes, deferredSearchQuery, selectedTag])

  const sortedNotes = useMemo(() => {
    const sorted = [...filteredNotes]
    switch (sortBy) {
      case 'title': return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      case 'created': return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      case 'words': return sorted.sort((a, b) => noteDna(b).words - noteDna(a).words)
      case 'updated':
      default: return sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    }
  }, [filteredNotes, sortBy])

  const pinnedNotes = useMemo(() => sortedNotes.filter(n => n.isPinned), [sortedNotes])
  const otherNotes = useMemo(() => sortedNotes.filter(n => !n.isPinned), [sortedNotes])

  const streamGroups = useMemo(() => {
    const groups = []
    for (const note of sortedNotes) {
      const ts = note.updatedAt || note.createdAt
      if (!ts) continue
      const d = new Date(ts)
      const key = format(d, 'yyyy-MM-dd')
      const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, MMM d')
      let g = groups[groups.length - 1]
      if (!g || g.key !== key) { g = { key, label, date: d, notes: [] }; groups.push(g) }
      g.notes.push(note)
    }
    return groups
  }, [sortedNotes])

  const stats = useMemo(() => {
    let totalWords = 0
    let checklistTotal = 0
    let checklistDone = 0
    const activeDays = new Set()
    for (const n of notes) {
      const dna = noteDna(n)
      totalWords += dna.words
      checklistTotal += dna.checklistTotal
      checklistDone += dna.checklistDone
      const ts = n.updatedAt || n.createdAt
      if (ts) activeDays.add(format(new Date(ts), 'yyyy-MM-dd'))
    }
    return { total: notes.length, words: totalWords, checklistTotal, checklistDone, activeDays: activeDays.size }
  }, [notes])

  const pageState = isLoading ? 'loading' : (notes.length === 0 ? 'empty' : 'ready')
  const hasFilters = searchQuery.trim().length > 0 || selectedTag !== null

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedTag(null)
    setSortBy('updated')
  }, [])

  const workspaceModeLabel = workspaceMode === 'ORG' ? 'ORG' : workspaceMode === 'CREWS' ? 'CREWS' : 'PERSONAL'
  const eyebrow = workspaceMode === 'ORG'
    ? WORKSPACE_EYEBROW.ORG(activeOrganization)
    : workspaceMode === 'CREWS'
      ? WORKSPACE_EYEBROW.CREWS(activeCrew)
      : WORKSPACE_EYEBROW.PERSONAL

  const subtitle = stats.total > 0
    ? `${stats.total} note${stats.total !== 1 ? 's' : ''} • ${stats.words.toLocaleString()} words • ${stats.checklistDone}/${stats.checklistTotal} checklist items • ${stats.activeDays} active day${stats.activeDays !== 1 ? 's' : ''}`
    : 'Capture thoughts, organize ideas, and build specs with markdown.'

  return (
    <PageShell maxWidth="default" workspaceMode={workspaceModeLabel}>
      <PageHero
        icon={BookOpen}
        eyebrow={eyebrow}
        title="Notes & Documentation"
        subtitle={subtitle}
        actions={
          <Button onClick={openNew} size="sm" className="gap-1.5 h-8 text-[12px] shrink-0 font-semibold shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            New Note
          </Button>
        }
      />

      {/* Quick capture strip */}
      <div className="w-full">
        <CaptureStrip onCreate={handleCreate} isCreating={createNote.isPending} />
      </div>

      <PageToolbar>
        <div className="flex flex-col gap-2.5 w-full">
          {/* Main search and view controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search notes by title, content, or tags..."
              debounceMs={0}
              className="flex-1 max-w-md"
            />

            <div className="flex items-center gap-2 shrink-0">
              {/* View mode toggle */}
              <div className="flex items-center bg-[var(--bg-subtle)] rounded-xl p-0.5 border border-[var(--border-subtle)]">
                <button
                  onClick={() => setMode('canvas')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer',
                    gardenMode === 'canvas'
                      ? 'bg-[var(--bg-elevated)] shadow-xs text-[var(--accent)] font-semibold'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Canvas
                </button>
                <button
                  onClick={() => setMode('stream')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer',
                    gardenMode === 'stream'
                      ? 'bg-[var(--bg-elevated)] shadow-xs text-[var(--accent)] font-semibold'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <ListIcon className="w-3.5 h-3.5" /> Stream
                </button>
              </div>

              {/* Sort menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] transition-colors cursor-pointer text-[var(--text-secondary)] shadow-xs"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <span className="hidden sm:inline">Sort:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
                  </span>
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-30 overflow-hidden py-1">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortBy(opt.id); setShowSortMenu(false) }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors cursor-pointer text-left",
                            sortBy === opt.id
                              ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                          )}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                          {sortBy === opt.id && <CheckCircle2 className="w-3 h-3 ml-auto text-[var(--accent)]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Tag Filter Bar (if workspace has tags) */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer border',
                  selectedTag === null
                    ? 'bg-[var(--accent)] text-white border-transparent shadow-xs'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                )}
              >
                All Tags ({notes.length})
              </button>
              {allTags.map(tag => {
                const count = notes.filter(n => (n.tags || []).includes(tag)).length
                const isSelected = selectedTag === tag

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all shrink-0 cursor-pointer border',
                      isSelected
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)] font-semibold shadow-xs'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]'
                    )}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    <span>{tag}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                    {isSelected && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PageToolbar>

      <PageContent>
        <PageState
          state={pageState}
          stateProps={{
            skeleton: <NoteSkeleton />,
            loadingVariant: 'cards',
            onAction: openNew,
            actionLabel: 'New Note',
          }}
        >
          {isLoading ? (
            <NoteSkeleton />
          ) : filteredNotes.length === 0 ? (
            <NotesEmptyState
              searchQuery={searchQuery}
              onAction={hasFilters ? clearFilters : openNew}
              hasFilters={hasFilters}
            />
          ) : gardenMode === 'canvas' ? (
            <div className="space-y-8">
              {pinnedNotes.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[var(--accent-soft)] flex items-center justify-center">
                        <Pin className="w-3 h-3 fill-[var(--accent)] text-[var(--accent)]" />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider font-mono">
                        Pinned Notes
                      </span>
                    </div>
                    <Badge variant="secondary" size="xs" className="font-mono text-[10px]">
                      {pinnedNotes.length}
                    </Badge>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onOpen={openEdit}
                        onDelete={handleDeleteNote}
                        onTogglePin={togglePin}
                        onSelectTag={handleSelectTag}
                        isPinnedSection
                      />
                    ))}
                  </div>
                </section>
              )}

              {otherNotes.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[var(--bg-subtle)] flex items-center justify-center">
                        <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider font-mono">
                        {pinnedNotes.length > 0 ? 'Other Notes' : 'All Notes'}
                      </span>
                    </div>
                    <Badge variant="secondary" size="xs" className="font-mono text-[10px]">
                      {otherNotes.length}
                    </Badge>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {otherNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onOpen={openEdit}
                        onDelete={handleDeleteNote}
                        onTogglePin={togglePin}
                        onSelectTag={handleSelectTag}
                        isPinnedSection={false}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {streamGroups.map(group => (
                <StreamDay
                  key={group.key}
                  group={group}
                  onOpen={openEdit}
                  onDelete={handleDeleteNote}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          )}
        </PageState>
      </PageContent>

      <NotePanel
        note={activeNote}
        isOpen={isPanelOpen}
        onClose={closePanel}
        notes={notes}
        scope={scope}
      />
      {dialog}
    </PageShell>
  )
}

function isYesterday(d) {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return isSameDay(d, y)
}

export default NotesPage
