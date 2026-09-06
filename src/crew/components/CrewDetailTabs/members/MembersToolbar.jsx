import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/Select';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';
import { LayoutGrid, List } from '@/shared/ui/Icons';
import { PillNav } from '@/shared/ui/PillNav';

// Controls: search, role filter, view switcher & invite actions
export function MembersToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  viewMode,
  onViewModeChange,
  onInvite,
  onGenerateInviteLink,
  isInviteLinkPending,
  isLinkCopied,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search members or email"
        debounceMs={0}
        className="flex-1 sm:w-56 min-w-[180px]"
      />

      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="h-9 w-[120px] text-sm border-[var(--border-subtle)]">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All roles</SelectItem>
          <SelectItem value="OWNER">Owners</SelectItem>
          <SelectItem value="ADMIN">Admins</SelectItem>
          <SelectItem value="MEMBER">Members</SelectItem>
        </SelectContent>
      </Select>

      <PillNav
        items={[
          { value: 'grid', label: 'Grid', icon: LayoutGrid },
          { value: 'table', label: 'Table', icon: List }
        ]}
        value={viewMode}
        onChange={onViewModeChange}
      />

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" className="h-9 text-sm" onClick={onGenerateInviteLink} isLoading={isInviteLinkPending}>
          {isLinkCopied ? 'Copied' : 'Copy invite link'}
        </Button>
        <Button size="sm" className="h-9 text-sm" onClick={onInvite}>
          Invite
        </Button>
      </div>
    </div>
  );
}