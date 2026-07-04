import type {
  DteDocument,
  DashboardStats,
  ProcessingVolumePoint,
  DteQueryFilters,
} from '@/types/dte';
import { dteService } from '@/services/dteService';

export const dteQueryKeys = {
  all: ['dte'] as const,
  documents: (filters?: DteQueryFilters) =>
    [...dteQueryKeys.all, 'documents', filters] as const,
  document: (id: string) => [...dteQueryKeys.all, 'document', id] as const,
  stats: () => [...dteQueryKeys.all, 'stats'] as const,
  volume: () => [...dteQueryKeys.all, 'volume'] as const,
};

export const dteQueries = {
  documents: (filters?: Parameters<typeof dteService.getDocuments>[0]) => ({
    queryKey: dteQueryKeys.documents(filters),
    queryFn: () => dteService.getDocuments(filters),
    staleTime: 30_000,
  }),

  document: (id: string) => ({
    queryKey: dteQueryKeys.document(id),
    queryFn: () => dteService.getDocumentById(id),
    enabled: Boolean(id),
  }),

  stats: () => ({
    queryKey: dteQueryKeys.stats(),
    queryFn: () => dteService.getDashboardStats(),
    staleTime: 60_000,
  }),

  volume: () => ({
    queryKey: dteQueryKeys.volume(),
    queryFn: () => dteService.getProcessingVolume(),
    staleTime: 60_000,
  }),
};

export type { DteDocument, DashboardStats, ProcessingVolumePoint };
