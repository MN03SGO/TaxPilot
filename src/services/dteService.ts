import type {
  DashboardStats,
  DteDocument,
  DteListResponse,
  DteQueryFilters,
  ProcessingVolumePoint,
} from '@/types/dte';
import { api } from '@/services/api';
import {
  MOCK_DTE_DOCUMENTS,
  computeDashboardStats,
  computeProcessingVolume,
} from '@/data/mockDte';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const dteService = {
  async getDocuments(filters: DteQueryFilters = {}): Promise<DteListResponse> {
    if (USE_MOCK) {
      return filterMockDocuments(filters);
    }

    const { data } = await api.get<DteListResponse>('/dte-documents', {
      params: filters,
    });
    return data;
  },

  async getDocumentById(id: string): Promise<DteDocument> {
    if (USE_MOCK) {
      const doc = MOCK_DTE_DOCUMENTS.find((d) => d.id === id);
      if (!doc) throw new Error('DTE not found');
      return doc;
    }

    const { data } = await api.get<DteDocument>(`/dte-documents/${id}`);
    return data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK) {
      return computeDashboardStats(MOCK_DTE_DOCUMENTS);
    }

    const { data } = await api.get<DashboardStats>('/dte-documents/stats');
    return data;
  },

  async getProcessingVolume(): Promise<ProcessingVolumePoint[]> {
    if (USE_MOCK) {
      return computeProcessingVolume(MOCK_DTE_DOCUMENTS);
    }

    const { data } = await api.get<ProcessingVolumePoint[]>(
      '/dte-documents/processing-volume',
    );
    return data;
  },
};

function filterMockDocuments(filters: DteQueryFilters): DteListResponse {
  let results = [...MOCK_DTE_DOCUMENTS];

  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      (doc) =>
        doc.id.toLowerCase().includes(term) ||
        doc.emisor_nombre.toLowerCase().includes(term) ||
        doc.codigo_generacion.toLowerCase().includes(term),
    );
  }

  if (filters.status && filters.status !== 'all') {
    const isValid = filters.status === 'valid';
    results = results.filter((doc) => doc.es_valido === isValid);
  }

  const total = results.length;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const start = (page - 1) * pageSize;

  return {
    data: results.slice(start, start + pageSize),
    total,
  };
}
