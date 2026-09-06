import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/shared/ui/Modal';
import { Heading, Text, Label } from '@/shared/ui/Typography';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Icons, Sparkles, Check, Shield, Users, Pencil } from '@/shared/ui/Icons';
import { cn } from '@/shared/lib/cn';
import { toast } from 'sonner';
import { useUpdateCrew } from '../features/hooks/useCrews';

const PRESET_COLORS = [
  { id: 'indigo', label: 'Indigo', hex: 'var(--accent)', hue: 239, sat: 84, light: 67 },
  { id: 'cyan', label: 'Cyan', hex: 'var(--accent)', hue: 189, sat: 94, light: 43 },
  { id: 'emerald', label: 'Emerald', hex: 'var(--success)', hue: 160, sat: 84, light: 39 },
  { id: 'amber', label: 'Amber', hex: 'var(--warning)', hue: 38, sat: 92, light: 50 },
  { id: 'rose', label: 'Rose', hex: 'var(--danger)', hue: 349, sat: 89, light: 60 },
  { id: 'violet', label: 'Violet', hex: 'var(--accent)', hue: 263, sat: 90, light: 66 },
  { id: 'azure', label: 'Azure', hex: 'var(--accent)', hue: 217, sat: 91, light: 60 },
  { id: 'teal', label: 'Teal', hex: 'var(--success)', hue: 173, sat: 80, light: 40 },
];

function hashHue(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function resolveColor(avatarUrl) {
  if (avatarUrl && avatarUrl.startsWith('color:')) {
    const colorId = avatarUrl.replace('color:', '');
    const found = PRESET_COLORS.find(c => c.id === colorId);
    if (found) return found;
  }
  return PRESET_COLORS[0];
}

export function EditCrewModal({ open, onOpenChange, crew, membersCount = 1 }) {
  const updateCrewMutation = useUpdateCrew();

  const [crewName, setCrewName] = useState('');
  const [crewDesc, setCrewDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [visibility, setVisibility] = useState('PUBLIC_LINK');
  const [memberCap, setMemberCap] = useState(15);

  useEffect(() => {
    if (crew && open) {
      setCrewName(crew.name || '');
      setCrewDesc(crew.description || '');
      setVisibility(crew.visibility || 'PUBLIC_LINK');
      setMemberCap(crew.memberCap || 15);
      setSelectedColor(resolveColor(crew.avatarUrl));
    }
  }, [crew, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = crewName.trim();
    if (!trimmedName) {
      return toast.error('Crew name is required');
    }

    const cap = Number(memberCap);
    if (isNaN(cap) || cap < 2) {
      return toast.error('Member cap must be at least 2');
    }
    if (cap < membersCount) {
      return toast.error(`Member cap cannot be less than current member count (${membersCount})`);
    }

    updateCrewMutation.mutate(
      {
        crewId: crew.id,
        payload: {
          name: trimmedName,
          description: crewDesc.trim(),
          visibility,
          memberCap: cap,
          avatarUrl: `color:${selectedColor.id}`,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const previewHue = selectedColor?.hue ?? hashHue(crewName || '?');

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg !bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl rounded-2xl p-6">
        <ModalHeader className="pb-3 border-b border-[var(--border-subtle)]">
          <ModalTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[var(--accent)]" /> Edit Crew Details
          </ModalTitle>
          <ModalDescription className="text-xs text-[var(--text-muted)] mt-0.5">
            Update your crew's name, mission objective, visibility, and squad settings.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Live Card Preview */}
          <div
            className="relative p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 overflow-hidden transition-all duration-200"
            style={{
              background: `radial-gradient(circle at 90% 10%, hsl(${previewHue} 80% 50% / 0.12) 0%, transparent 60%)`,
            }}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" /> Live Preview
            </div>
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md text-sm transition-transform"
                style={{
                  background: `linear-gradient(135deg, hsl(${previewHue} 75% 55%), hsl(${(previewHue + 35) % 360} 70% 40%))`,
                }}
              >
                {(crewName.trim() || crew?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[14px] text-[var(--text-primary)] truncate">
                  {crewName.trim() || 'Crew Name'}
                </div>
                <div className="text-[12px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                  {crewDesc.trim() || 'No mission objective set'}
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] uppercase shrink-0 font-mono">
                {String(visibility).replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Accent Theme Selection */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[var(--text-secondary)] flex items-center justify-between">
              <span>Brand Accent Theme</span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">{selectedColor.label}</span>
            </Label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = selectedColor.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    title={c.label}
                    className={cn(
                      'h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer relative',
                      isSelected
                        ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-card)] scale-105'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    )}
                    style={{ background: c.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crew Name */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Crew Name <span className="text-[var(--danger)]">*</span>
            </Label>
            <Input
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="e.g. Core Engineering, Apollo 11..."
              maxLength={100}
              required
              className="h-9 text-[13px] rounded-lg bg-[var(--bg-card)]"
            />
          </div>

          {/* Mission Objective / Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] font-semibold text-[var(--text-secondary)]">
                Mission Objective / Description
              </Label>
              <span
                className={cn(
                  'text-[10px] font-mono',
                  crewDesc.length > 250 ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
                )}
              >
                {crewDesc.length}/280
              </span>
            </div>
            <Textarea
              value={crewDesc}
              onChange={(e) => setCrewDesc(e.target.value.slice(0, 280))}
              placeholder="What is the primary objective of this squad?"
              className="min-h-[75px] text-[13px] rounded-lg resize-none bg-[var(--bg-card)]"
            />
          </div>

          {/* Visibility & Member Cap */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Access Visibility
              </Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-9 text-[12px] rounded-lg bg-[var(--bg-card)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[var(--border-subtle)]">
                  <SelectItem value="PUBLIC">Public Workspace</SelectItem>
                  <SelectItem value="PUBLIC_LINK">Public Link Access</SelectItem>
                  <SelectItem value="INVITE_ONLY">Invite Only (Private)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Member Cap
              </Label>
              <Input
                type="number"
                value={memberCap}
                onChange={(e) => setMemberCap(e.target.value)}
                min={Math.max(2, membersCount)}
                max={100}
                className="h-9 text-[12px] rounded-lg bg-[var(--bg-card)]"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <ModalFooter className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-[12px] px-3.5"
              onClick={() => onOpenChange(false)}
              disabled={updateCrewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-8 text-[12px] px-4 font-semibold gap-1.5 shadow-sm"
              isLoading={updateCrewMutation.isPending}
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default EditCrewModal;
