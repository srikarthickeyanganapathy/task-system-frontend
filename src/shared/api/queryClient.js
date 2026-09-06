import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds fresh duration
      gcTime: 10 * 60 * 1000, // 10 minutes cache persistence
      retry: 1,
      refetchOnWindowFocus: false, // Prevent jarring refetches on window focus
      refetchOnMount: true, // Stale-while-revalidate background refresh on mount
      refetchOnReconnect: true, // Auto-revalidate when connection restores
    },
    mutations: {
      retry: 0,
    },
  },
});
