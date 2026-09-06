import { useMemo } from 'react';
import { Heading, Text } from '@/shared/ui/Typography';
import { cn } from '@/shared/lib/cn';

export function HeatmapMatrix({ rows, threshold, history }) {
  const days = useMemo(() => {
    if (history && Object.values(history).some(h => Array.isArray(h) && h.length > 0)) {
      // Get dates from first user's history (all users share same date range)
      const firstHistory = Object.values(history).find(h => Array.isArray(h) && h.length > 0);
      if (firstHistory && firstHistory[0]?.date) {
        return firstHistory.map(snap => new Date(snap.date + 'T00:00:00'));
      }
    }
    // Fallback to last 14 days
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
  }, [history]);

  const getCellColor = (value) => {
    if (value === 0) return 'bg-[var(--bg-subtle)]';
    if (value <= threshold * 0.5) return 'bg-emerald-500/40';
    if (value <= threshold * 0.8) return 'bg-amber-500/40';
    if (value <= threshold) return 'bg-orange-500/50';
    return 'bg-red-500/60';
  };

  const dowLabel = (d) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 overflow-x-auto shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Heading level={3} className="text-[14px] font-semibold tracking-tight">
          14-Day Capacity Heatmap
        </Heading>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-emerald-500/40"></div>Low
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-amber-500/40"></div>Normal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-red-500/60"></div>Over
          </span>
        </div>
      </div>

      <div className="min-w-[640px]">
        <div className="grid grid-cols-[200px_1fr] gap-2 mb-2">
          <div></div>
          <div className="grid grid-cols-14 gap-1">
            {days.map((d, i) => (
              <div
                key={i}
                className="text-center font-mono leading-tight"
              >
                <div className="text-[8px] text-[var(--text-muted)] opacity-70">
                  {dowLabel(d)}
                </div>
                <div className="text-[9px] text-[var(--text-muted)]">
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {rows.map((row) => {
            const userId = row.user?.id || row.user?.username;
            const userHistory = history[userId] || [];
            return (
              <div
                key={userId}
                className="grid grid-cols-[200px_1fr] gap-2 items-center hover:bg-[var(--bg-subtle)]/50 p-1 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-[7px] flex items-center justify-center font-bold text-[10px] shrink-0',
                      (row.totalActiveCount ?? 0) > threshold
                        ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                        : 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]',
                    )}
                  >
                    {(row.user?.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <Text className="font-medium text-[12px] truncate text-[var(--text-primary)]">
                    {row.user?.fullName || row.user?.username || 'Unknown'}
                  </Text>
                  <span className="ml-auto font-mono text-[9px] text-[var(--text-muted)] shrink-0">
                    now <b className="text-[var(--text-secondary)]">{row.totalActiveCount ?? 0}</b>
                  </span>
                </div>
                <div className="grid grid-cols-14 gap-1">
                  {userHistory.length === 0 && (
                    <div className="col-span-14 flex items-center justify-center text-[10px] text-[var(--text-muted)] italic">
                      History data accumulating...
                    </div>
                  )}
                  {userHistory.map((val, i) => {
                    const activeCount = val.activeCount !== undefined ? val.activeCount : val;
                    const prevVal = userHistory[i - 1];
                    const prevActiveCount = prevVal ? (prevVal.activeCount !== undefined ? prevVal.activeCount : prevVal) : 0;
                    const diff = activeCount - prevActiveCount;
                    const tooltip = `${activeCount} active tasks on ${days[i].toLocaleDateString()}\n${diff > 0 ? '+' : ''}${diff} from yesterday`;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'h-6 rounded-[5px] transition-all hover:scale-110 hover:ring-1 hover:ring-[var(--accent)] cursor-pointer',
                          getCellColor(activeCount),
                        )}
                        title={tooltip}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
