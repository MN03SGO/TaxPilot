import { useQuery } from '@tanstack/react-query';
import { dteQueries } from '@/lib/queries';
import type { DteQueryFilters } from '@/types/dte';

export function useDteDocuments(filters?: DteQueryFilters) {
  return useQuery(dteQueries.documents(filters));
}

export function useDteDocument(id: string) {
  return useQuery(dteQueries.document(id));
}

export function useDashboardStats() {
  return useQuery(dteQueries.stats());
}

export function useProcessingVolume() {
  return useQuery(dteQueries.volume());
}
