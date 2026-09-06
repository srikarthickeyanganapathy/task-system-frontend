import React, { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/cn'
import { STATUS_MAP } from '@/shared/lib/statusLanguage'
import { CheckCircle2, TrendingUp, CalendarClock, PieChart as PieIcon, Layers } from 'lucide-react'

// Custom Premium Tooltip Wrapper for Area Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.12 }}
        className="bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--border-default)] p-3 rounded-xl shadow-[var(--shadow-lg)] min-w-[130px]"
      >
        <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-1">
          {label}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text-primary)] font-medium">Completed:</span>
          </div>
          <span className="font-bold font-mono tabular-nums text-[var(--accent)]">
            {value} {value === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </motion.div>
    )
  }
  return null
}

/**
 * Format raw status keys (e.g. IN_PROGRESS) into human-friendly labels & fallback colors
 */
function formatStatus(rawStatus) {
  const key = String(rawStatus || '').toUpperCase()
  const mapping = STATUS_MAP[key]
  if (mapping) {
    return {
      label: mapping.label,
      variant: mapping.variant,
    }
  }
  const prettified = key
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
  return { label: prettified, variant: 'neutral' }
}

const STATUS_COLOR_MAP = {
  IN_PROGRESS: 'var(--accent)',
  SUBMITTED: 'var(--warning)',
  APPROVED: 'var(--success)',
  COMPLETED: 'var(--success)',
  DONE: 'var(--success)',
  REJECTED: 'var(--danger)',
  TODO: 'var(--text-tertiary)',
}

/**
 * CompletionChart
 * Area chart tracking daily task completions.
 * Fixed height: h-[460px] with rounded-2xl to match PriorityChart.
 */
export const CompletionChart = React.memo(function CompletionChart({ data = [] }) {
  const [rangeDays, setRangeDays] = useState(30) // 7 | 14 | 30

  // Filter dataset to selected range window
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    if (data.length <= rangeDays) return data
    return data.slice(data.length - rangeDays)
  }, [data, rangeDays])

  // Summary statistics for the selected time window
  const summary = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { total: 0, avg: 0, peak: null }
    }
    const total = chartData.reduce((acc, curr) => acc + (Number(curr.completed) || 0), 0)
    const avg = chartData.length > 0 ? (total / chartData.length).toFixed(1) : 0
    let peak = null
    chartData.forEach((d) => {
      const val = Number(d.completed) || 0
      if (!peak || val > peak.value) {
        peak = { name: d.name, value: val }
      }
    })
    return { total, avg, peak }
  }, [chartData])

  return (
    <Card className="h-[460px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl backdrop-blur-xl shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Header - Fixed 56px height */}
      <CardHeader className="h-[56px] border-b border-[var(--border-subtle)]/60 px-5 py-2.5 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          <div>
            <CardTitle className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)] leading-none">
              Completion Trend
            </CardTitle>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-none">
              Daily velocity of finished tasks
            </p>
          </div>
        </div>

        {/* Range Filter Controls */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
          {[
            { label: '7D', days: 7 },
            { label: '14D', days: 14 },
            { label: '30D', days: 30 },
          ].map((btn) => (
            <button
              key={btn.days}
              type="button"
              onClick={() => setRangeDays(btn.days)}
              className={cn(
                'px-2.5 py-0.5 text-[11px] font-medium rounded-md transition-all duration-150',
                rangeDays === btn.days
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* KPI Micro-strip - Fixed 44px height */}
      <div className="h-[44px] grid grid-cols-3 divide-x divide-[var(--border-subtle)]/60 border-b border-[var(--border-subtle)]/60 bg-[var(--bg-subtle)]/25 text-center shrink-0 items-center px-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium leading-none">Completed</p>
          <p className="text-xs font-bold text-[var(--text-primary)] tabular-nums mt-1 leading-none">{summary.total}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium leading-none">Daily Avg</p>
          <p className="text-xs font-bold text-[var(--text-primary)] tabular-nums mt-1 leading-none">{summary.avg}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium leading-none">Peak Day</p>
          <p className="text-xs font-bold text-[var(--text-primary)] tabular-nums mt-1 leading-none truncate px-1">
            {summary.peak && summary.peak.value > 0 ? `${summary.peak.name} (${summary.peak.value})` : '—'}
          </p>
        </div>
      </div>

      {/* Main Chart Area - Fixed flex-1 height */}
      <CardContent className="flex-1 min-h-0 pt-4 pr-3 pl-0 pb-2 flex flex-col justify-center">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <CalendarClock className="w-8 h-8 text-[var(--text-tertiary)] opacity-60" />
            <p className="text-xs text-[var(--text-secondary)]">No historical data available for this range</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="ryokaiCompletionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F2724A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F2724A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border-subtle)"
                strokeOpacity={0.8}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                interval="preserveStartEnd"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}
                dx={-4}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#F2724A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#ryokaiCompletionGradient)"
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: 'var(--bg-elevated)',
                  fill: '#F2724A',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
})

/**
 * PriorityChart
 * Interactive Status Breakdown Donut Chart.
 * Fixed height: h-[460px] with rounded-2xl to match CompletionChart.
 */
export const PriorityChart = React.memo(function PriorityChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const defaultPalette = ['#FFC107', '#17A2B8', '#3E9D6F', '#E0546B', '#6B5F72']

  // Pre-process items with formatted names & safe numbers
  const formattedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    return data.map((item, idx) => {
      const { label } = formatStatus(item.name)
      const color = item.color || STATUS_COLOR_MAP[String(item.name).toUpperCase()] || defaultPalette[idx % defaultPalette.length]
      return {
        ...item,
        originalName: item.name,
        displayName: label,
        numericValue: Number(item.value) || 0,
        color,
      }
    })
  }, [data])

  const totalTasks = useMemo(() => {
    return formattedData.reduce((acc, curr) => acc + curr.numericValue, 0)
  }, [formattedData])

  const activeItem = hoveredIndex !== null ? formattedData[hoveredIndex] : null

  // Leading stage & active stages count
  const leadingStage = useMemo(() => {
    if (!formattedData.length) return null
    let max = formattedData[0]
    for (const d of formattedData) {
      if (d.numericValue > max.numericValue) max = d
    }
    return max.numericValue > 0 ? max : null
  }, [formattedData])

  const activeStagesCount = useMemo(() => {
    return formattedData.filter(d => d.numericValue > 0).length
  }, [formattedData])

  return (
    <Card className="h-[460px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl backdrop-blur-xl shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Header - Fixed 56px height (identically aligned with CompletionChart) */}
      <CardHeader className="h-[56px] border-b border-[var(--border-subtle)]/60 px-5 py-2.5 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-[var(--accent)]" />
          <div>
            <CardTitle className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)] leading-none">
              Status Breakdown
            </CardTitle>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-none">
              Workload distribution across stages
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
          {totalTasks} total
        </span>
      </CardHeader>

      {/* Symmetrical KPI Micro-strip - Fixed 44px height (identically aligned with CompletionChart) */}
      <div className="h-[44px] grid grid-cols-3 divide-x divide-[var(--border-subtle)]/60 border-b border-[var(--border-subtle)]/60 bg-[var(--bg-subtle)]/25 text-center shrink-0 items-center px-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium leading-none">Stages</p>
          <p className="text-xs font-bold text-[var(--text-primary)] tabular-nums mt-1 leading-none">{activeStagesCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium leading-none">Leading</p>
          <p className="text-xs font-bold text-[var(--text-primary)] tabular-nums mt-1 leading-none truncate px-1">
            {leadingStage ? leadingStage.displayName : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium leading-none">Completed</p>
          <p className="text-xs font-bold text-[var(--text-primary)] tabular-nums mt-1 leading-none">
            {totalTasks > 0 ? `${Math.round(((formattedData.find(d => d.displayName === 'Approved' || d.displayName === 'Done')?.numericValue || 0) / totalTasks) * 100)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Main Donut & Legend Area - Fixed flex-1 height */}
      <CardContent className="flex-1 min-h-0 p-4 flex flex-col justify-between">
        {totalTasks === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
              <PieIcon className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">No status data available</p>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full">
            {/* Donut Chart with Centered Metric */}
            <div className="relative h-[180px] w-full flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={76}
                    paddingAngle={4}
                    dataKey="numericValue"
                    stroke="none"
                    cornerRadius={4}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {formattedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          filter: hoveredIndex === index ? 'brightness(1.1) drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : 'none',
                          transform: hoveredIndex === index ? 'scale(1.03)' : 'scale(1)',
                          transformOrigin: 'center center',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem ? activeItem.displayName : 'total'}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="text-center px-2"
                  >
                    <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums leading-none">
                      {activeItem ? activeItem.numericValue : totalTasks}
                    </div>
                    <div className="text-[10px] font-medium text-[var(--text-tertiary)] mt-1 truncate max-w-[85px] leading-none">
                      {activeItem
                        ? `${Math.round((activeItem.numericValue / totalTasks) * 100)}%`
                        : 'Total Tasks'}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Custom Interactive Legend List - cleanly fills bottom half */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[var(--border-subtle)]/60">
              {formattedData.map((item, index) => {
                const percentage = totalTasks > 0 ? Math.round((item.numericValue / totalTasks) * 100) : 0
                const isHovered = hoveredIndex === index

                return (
                  <div
                    key={item.originalName}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      'flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors cursor-pointer',
                      isHovered ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]/40'
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-[var(--text-secondary)] text-[11px] font-medium">
                        {item.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pl-1">
                      <span className="font-bold text-[var(--text-primary)] text-[11px] tabular-nums">
                        {item.numericValue}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
