import React from 'react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Text } from '@/shared/ui/Typography'
import { cn } from '@/shared/lib/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * StatCard
 * - size="lg"        -> hero metrics (top of page, 1-2 max)
 * - size="md"        -> default, grouped secondary metrics
 * - tone="default"   -> standard neutral card
 * - tone="attention" -> subtly flags metrics that need action (overdue, revisions)
 * - tone="success"   -> highlights positive milestones (completion, done)
 * - tone="active"    -> indicates active work (in-progress)
 * - progress         -> optional completion percentage (0-100) rendered as a smooth bar
 */
export const StatCard = React.memo(function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  size = 'md',
  tone = 'default',
  progress,
  className,
}) {
  const isLg = size === 'lg'

  const toneCardStyles = {
    default: 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]',
    attention: 'border-[var(--danger)]/30 hover:border-[var(--danger)]/50 bg-[var(--bg-elevated)] shadow-[0_2px_12px_-4px_rgba(224,84,107,0.15)]',
    success: 'border-[var(--success)]/30 hover:border-[var(--success)]/50 bg-[var(--bg-elevated)] shadow-[0_2px_12px_-4px_rgba(62,157,111,0.15)]',
    active: 'border-[var(--accent)]/30 hover:border-[var(--accent)]/50 bg-[var(--bg-elevated)] shadow-[0_2px_12px_-4px_rgba(242,114,74,0.15)]',
  }

  const toneIconStyles = {
    default: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
    attention: 'bg-[var(--danger-soft)] text-[var(--danger)]',
    success: 'bg-[var(--success-soft)] text-[var(--success)]',
    active: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  }

  const toneValueColor = {
    default: 'text-[var(--text-primary)]',
    attention: 'text-[var(--danger)]',
    success: 'text-[var(--success)]',
    active: 'text-[var(--accent)]',
  }

  return (
    <Card
      role="region"
      aria-label={`${title}: ${value}`}
      className={cn(
        'group relative overflow-hidden bg-[var(--bg-elevated)] border rounded-2xl backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col justify-between',
        toneCardStyles[tone] || toneCardStyles.default,
        className
      )}
    >
      <CardContent className={cn('flex flex-col justify-between h-full flex-1', isLg ? 'p-5 sm:p-6' : 'p-4 sm:p-4.5')}>
        {/* Top: Title & Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Text
              size="xs"
              className={cn(
                'font-medium tracking-tight truncate text-[var(--text-secondary)]',
                isLg ? 'text-[13px]' : 'text-[12px]'
              )}
            >
              {title}
            </Text>

            <div
              className={cn(
                'font-bold tabular-nums tracking-tight mt-1.5',
                isLg ? 'text-[32px] sm:text-[36px] leading-tight' : 'text-[22px] sm:text-[24px] leading-snug',
                tone !== 'default' && !isLg ? toneValueColor[tone] : 'text-[var(--text-primary)]'
              )}
            >
              {value}
            </div>
          </div>

          {Icon && (
            <div
              className={cn(
                'shrink-0 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
                isLg ? 'w-11 h-11' : 'w-9 h-9',
                toneIconStyles[tone] || toneIconStyles.default
              )}
            >
              <Icon
                className={cn(isLg ? 'w-5 h-5' : 'w-4 h-4')}
                strokeWidth={isLg ? 2 : 1.75}
              />
            </div>
          )}
        </div>

        {/* Progress Bar (for hero metrics to equalize vertical rhythm) */}
        {typeof progress === 'number' && (
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full bg-[var(--bg-subtle)] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-[var(--ease-out)]"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Description & Trend Pill */}
        <div className="mt-3 flex items-center gap-2 flex-wrap min-h-[20px]">
          {trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums',
                trend > 0
                  ? 'bg-[var(--success-soft)] text-[var(--success)]'
                  : trend < 0
                  ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 shrink-0" strokeWidth={2.2} />
              ) : trend < 0 ? (
                <TrendingDown className="w-3 h-3 shrink-0" strokeWidth={2.2} />
              ) : (
                <Minus className="w-3 h-3 shrink-0" strokeWidth={2} />
              )}
              {trend > 0 ? `+${Math.abs(trend)}%` : trend < 0 ? `-${Math.abs(trend)}%` : '0%'}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[var(--text-tertiary)] leading-none truncate">
              {description}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
})