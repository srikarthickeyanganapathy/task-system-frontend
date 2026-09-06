import { Heading, Text } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';
import { Drawer, DrawerContent } from '@/shared/ui/Drawer';
import { Mail } from '@/shared/ui/Icons';
import { MemberAvatar, RoleLabel, PresenceLabel } from './MemberAvatar';
import { formatJoinDate, getMemberPresence } from './utils';

// --- Member detail drawer ---
export function MemberDetailDrawer({ member, isOpen, onClose, workload, isCreator, onTransfer, onRemove }) {
  if (!member) return null;

  const isOwner = member.role === 'CREATOR' || member.role === 'OWNER';
  const presence = getMemberPresence(member);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent side="right" className="sm:max-w-md w-full flex flex-col h-full bg-[var(--bg-card)] border-l border-[var(--border-subtle)] p-0">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-start gap-4">
            <MemberAvatar member={member} size="lg" />
            <div className="min-w-0 flex-1">
              <Heading level={3} className="text-base font-medium text-[var(--text-primary)] truncate">
                {member.username || 'Unknown member'}
              </Heading>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{member.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <RoleLabel member={member} />
                <span className="text-[var(--border-default)]">·</span>
                <PresenceLabel presence={presence} />
                <span className="text-[var(--border-default)]">·</span>
                <span className="text-xs text-[var(--text-muted)]">
                  Joined {formatJoinDate(member.joinedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Workload */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--bg-subtle)] rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">{workload.total}</div>
              <Text variant="muted" size="xs">Total</Text>
            </div>
            <div className="text-center">
              <div className={cn('text-lg font-semibold tabular-nums', workload.levelColor)}>{workload.active}</div>
              <Text variant="muted" size="xs">Active</Text>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-[var(--success)] tabular-nums">{workload.completed}</div>
              <Text variant="muted" size="xs">Done</Text>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Workload</span>
              <span className={workload.levelColor}>{workload.level}</span>
            </div>
            <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', workload.barColor)}
                style={{ width: workload.active > 0 ? `${Math.min(100, (workload.active / 6) * 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Assigned tasks */}
          <div className="space-y-3">
            <Text variant="muted" size="xs" className="font-medium">
              Assigned tasks ({workload.memberTasks.length})
            </Text>

            {workload.memberTasks.length > 0 ? (
              <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                {workload.memberTasks.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate">{t.title}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {t.priority || 'Medium'} priority · {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs shrink-0',
                        t.status === 'COMPLETED' || t.status === 'Done'
                          ? 'text-[var(--success)]'
                          : 'text-[var(--text-muted)]'
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Text variant="muted" size="xs">No tasks currently assigned in this crew.</Text>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {isCreator && !isOwner && (
          <div className="p-4 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-9 text-xs"
              onClick={() => {
                onClose();
                onTransfer(member.userId);
              }}
            >
              Make owner
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs text-[var(--danger)]"
              onClick={() => {
                onClose();
                onRemove(member.userId);
              }}
            >
              Remove
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}