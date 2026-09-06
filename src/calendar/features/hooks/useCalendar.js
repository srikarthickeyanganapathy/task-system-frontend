import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as calendarApi from '../api/calendar.api';
import { queryKeys } from '@/shared/api/queryKeys';
import { normalizeCalendarEvent } from '../../entities/model/normalizer';
import { toast } from 'sonner';

/**
 * Derive a stable scope key from workspace scope for query key partitioning.
 */
const scopeKey = (scope) => {
  if (scope?.orgId) return `org:${scope.orgId}`;
  if (scope?.crewId) return `crew:${scope.crewId}`;
  return 'personal';
};

export { scopeKey };

/**
 * Fetch events for a date range + workspace scope.
 * Uses placeholderData to avoid flashing skeletons on month/week navigation.
 */
export function useCalendarEvents(start, end, scope = {}) {
  const sk = scopeKey(scope);
  const isPendingScope = scope?.orgId === 'pending' || scope?.crewId === 'pending';
  
  return useQuery({
    queryKey: queryKeys.calendarEvents.range(start, end, sk),
    queryFn: async () => {
      const events = await calendarApi.getCalendarEvents(start, end, scope);
      return Array.isArray(events) ? events.map(normalizeCalendarEvent) : events;
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: !!start && !!end && !isPendingScope,
  });
}

/**
 * Prefetch calendar events for a date range + scope into cache.
 */
export function prefetchCalendarEvents(queryClient, start, end, scope = {}) {
  if (!queryClient || !start || !end) return;
  const isPendingScope = scope?.orgId === 'pending' || scope?.crewId === 'pending';
  if (isPendingScope) return;

  const sk = scopeKey(scope);
  return queryClient.prefetchQuery({
    queryKey: queryKeys.calendarEvents.range(start, end, sk),
    queryFn: async () => {
      const events = await calendarApi.getCalendarEvents(start, end, scope);
      return Array.isArray(events) ? events.map(normalizeCalendarEvent) : events;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateEvent(scope = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => calendarApi.createCalendarEvent(payload, scope),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['calendarEvents'] });

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticEvent = normalizeCalendarEvent({
        id: tempId,
        title: payload.title || 'Untitled Event',
        description: payload.description || '',
        location: payload.location || '',
        startTime: payload.startTime || new Date().toISOString(),
        endTime: payload.endTime || null,
        isAllDay: !!payload.isAllDay,
        type: payload.type || 'EVENT',
        createdAt: new Date().toISOString(),
        ...payload,
        id: tempId,
      });

      queryClient.setQueriesData({ queryKey: ['calendarEvents'] }, (old) => {
        if (!Array.isArray(old)) return [optimisticEvent];
        return [optimisticEvent, ...old];
      });

      return { snapshots, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Could not create event');
    },
    onSuccess: (savedEvent, _vars, ctx) => {
      if (savedEvent && ctx?.tempId) {
        const normalized = normalizeCalendarEvent(savedEvent);
        queryClient.setQueriesData({ queryKey: ['calendarEvents'] }, (old) => {
          if (!Array.isArray(old)) return [normalized];
          return old.map((ev) => (ev.id === ctx.tempId ? normalized : ev));
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
}

/**
 * Update event with optimistic UI -- patches all cached calendar event
 * query arrays in-place, rolls back on error.
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => calendarApi.updateCalendarEvent(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['calendarEvents'] });

      queryClient.setQueriesData({ queryKey: ['calendarEvents'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((ev) => {
          if (ev.id === id) {
            return normalizeCalendarEvent({
              ...ev,
              ...payload,
              id,
              updatedAt: new Date().toISOString(),
            });
          }
          return ev;
        });
      });

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Could not update event');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.deleteCalendarEvent,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['calendarEvents'] });

      queryClient.setQueriesData({ queryKey: ['calendarEvents'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((ev) => ev.id !== id);
      });

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Could not delete event');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
}
