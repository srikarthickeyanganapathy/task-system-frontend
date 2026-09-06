import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notesApi from '../api/notes.api';
import { queryKeys } from '@/shared/api/queryKeys';
import { normalizeNote } from '../../entities/model/normalizer';
import { toast } from 'sonner';

/**
 * Derive a stable scope key from workspace scope for query key partitioning.
 * Empty object = personal (no suffix needed, matches unscoped).
 */
export const scopeKey = (scope) => {
  if (scope?.orgId) return `org:${scope.orgId}`;
  if (scope?.crewId) return `crew:${scope.crewId}`;
  return 'personal';
};

/**
 * Hook: fetch notes for a given workspace scope.
 * Uses placeholderData to avoid flashing skeletons on scope switches.
 * @param {{ orgId?: number, crewId?: number }} scope
 */
export const useNotes = (scope = {}) => useQuery({
  queryKey: queryKeys.notes.scoped(scopeKey(scope)),
  queryFn: async () => {
    const notes = await notesApi.getNotes(scope);
    return Array.isArray(notes) ? notes.map(normalizeNote) : notes;
  },
  staleTime: 60000,
  placeholderData: (prev) => prev,
});

/**
 * Prefetch notes for a workspace scope into the query cache.
 * Useful on navigation hover or router transition.
 */
export const prefetchNotes = (queryClient, scope = {}) => {
  if (!queryClient) return;
  return queryClient.prefetchQuery({
    queryKey: queryKeys.notes.scoped(scopeKey(scope)),
    queryFn: async () => {
      const notes = await notesApi.getNotes(scope);
      return Array.isArray(notes) ? notes.map(normalizeNote) : notes;
    },
    staleTime: 60000,
  });
};

export const useCreateNote = (scope = {}) => {
  const qc = useQueryClient();
  const currentKey = queryKeys.notes.scoped(scopeKey(scope));

  return useMutation({
    mutationFn: (payload) => notesApi.createNote(payload, scope),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: currentKey });

      const previousNotes = qc.getQueryData(currentKey);

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticNote = normalizeNote({
        id: tempId,
        title: payload.title || 'Untitled Note',
        content: payload.content || '',
        color: payload.color || 'default',
        isPinned: !!payload.isPinned,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...payload,
        id: tempId,
      });

      qc.setQueryData(currentKey, (old) => {
        if (!Array.isArray(old)) return [optimisticNote];
        return [optimisticNote, ...old];
      });

      return { previousNotes, currentKey, tempId };
    },
    onError: (err, payload, context) => {
      if (context?.currentKey && context?.previousNotes !== undefined) {
        qc.setQueryData(context.currentKey, context.previousNotes);
      }
      toast.error('Could not create note');
    },
    onSuccess: (savedNote, payload, context) => {
      if (savedNote && context?.currentKey) {
        qc.setQueryData(context.currentKey, (old) => {
          if (!Array.isArray(old)) return [normalizeNote(savedNote)];
          return old.map((n) => (n.id === context.tempId ? normalizeNote(savedNote) : n));
        });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => notesApi.updateNote(id, payload),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: ['notes'] });

      const previousQueries = qc.getQueriesData({ queryKey: ['notes'] });

      qc.setQueriesData({ queryKey: ['notes'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((note) => {
          if (note.id === id) {
            return normalizeNote({
              ...note,
              ...payload,
              updatedAt: new Date().toISOString(),
            });
          }
          return note;
        });
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      toast.error('Could not update note');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notesApi.deleteNote,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notes'] });

      const previousQueries = qc.getQueriesData({ queryKey: ['notes'] });

      qc.setQueriesData({ queryKey: ['notes'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((note) => note.id !== id);
      });

      return { previousQueries };
    },
    onError: (err, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      toast.error('Could not delete note');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};
