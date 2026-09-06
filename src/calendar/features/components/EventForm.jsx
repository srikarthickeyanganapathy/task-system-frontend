import React, { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { Switch } from '@/shared/ui/Switch'
import { Text, Label } from '@/shared/ui/Typography'
import { Trash2 } from '@/shared/ui/Icons'

/**
 * Event create/edit form.
 * - Pass `defaultValues.id` to switch into edit mode (submit label + delete action).
 * - `onDelete` is required for the delete action to appear in edit mode.
 */
function EventFormComponent({ onSubmit, onCancel, onDelete, isLoading, isDeleting, defaultValues }) {
  const isEditing = !!defaultValues?.id
  const [form, setForm] = useState(defaultValues)
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.isAllDay && form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      setError('End time must be after the start time.')
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium uppercase tracking-wider">Event Title</Label>
        <Input placeholder="e.g., Weekly Sync" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="h-9 text-[13px]" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium uppercase tracking-wider">Description</Label>
        <Textarea placeholder="Add details (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="text-[13px]" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium uppercase tracking-wider">Location</Label>
        <Input placeholder="e.g., Conference Room B / Meet link" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 text-[13px]" />
      </div>

      <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)]/50 rounded-xl border border-[var(--border-subtle)]">
        <div>
          <Label className="text-[12px] font-medium">All day event</Label>
          <Text variant="secondary" className="text-[11px] mt-0.5 text-[var(--text-tertiary)]">Does not have a specific start or end time</Text>
        </div>
        <Switch checked={form.isAllDay} onCheckedChange={(checked) => { setForm({ ...form, isAllDay: checked }); setError(null) }} />
      </div>

      {!form.isAllDay && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-wider">Start Time</Label>
            <Input type="datetime-local" value={form.startTime} onChange={(e) => { setForm({ ...form, startTime: e.target.value }); setError(null) }} required className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-wider">End Time</Label>
            <Input type="datetime-local" value={form.endTime} onChange={(e) => { setForm({ ...form, endTime: e.target.value }); setError(null) }} required className="h-9 text-[13px]" />
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-[var(--danger)] bg-[var(--danger-soft)]/50 border border-[var(--danger)]/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-between items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
        {onDelete && isEditing ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-[12px] text-[var(--danger)] hover:bg-[var(--danger-soft)] gap-1.5" onClick={onDelete} disabled={isDeleting} isLoading={isDeleting}>
            {!isDeleting && <Trash2 className="w-3.5 h-3.5" />}
            {isDeleting ? 'Deleting...' : 'Delete Event'}
          </Button>
        ) : <span />}
        <div className="flex items-center gap-3">
          {onCancel && <Button type="button" variant="outline" size="sm" className="h-8 text-[12px]" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" size="sm" className="h-8 text-[12px]" disabled={isLoading} isLoading={isLoading}>
            {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export const EventForm = React.memo(EventFormComponent)

