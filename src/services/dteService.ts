import type {
  DashboardStats,
  DteDocument,
  DteListResponse,
  DteQueryFilters,
  ProcessingVolumePoint,
} from '@/types/dte';
import { supabase } from '@/lib/supabase';
import { createDteSignedUrls } from '@/lib/dteDocuments';
import {
  MOCK_DTE_DOCUMENTS,
  computeDashboardStats,
  computeProcessingVolume,
} from '@/data/mockDte';

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  (typeof window !== 'undefined' && localStorage.getItem('taxpilot_mock_bypass') === 'true');

const mapDteRow = (row: any): DteDocument => {
  let fechaStr = '';
  if (row.fecha) {
    if (row.fecha instanceof Date) {
      const y = row.fecha.getFullYear();
      const m = String(row.fecha.getMonth() + 1).padStart(2, '0');
      const d = String(row.fecha.getDate()).padStart(2, '0');
      fechaStr = `${y}-${m}-${d}`;
    } else {
      fechaStr = String(row.fecha).slice(0, 10);
    }
  }

  return {
    id: row.id,
    codigo_generacion: row.numero_dte || '',
    tipo_dte: '03', // Default fallback
    emisor_nombre: row.emisor || '',
    emisor_nit: '0614-000000-000-0', // Default fallback NIT
    receptor_nombre: row.receptor || null,
    fecha_emision: fechaStr,
    monto_total: Number(row.monto_total) || 0,
    moneda: 'USD',
    es_valido: Boolean(row.es_valido),
    observaciones: row.observaciones || null,
    created_at: row.created_at || '',
    updated_at: row.created_at || '',
  };
};

// Helper to fetch signed URLs for matched documents
async function attachFilesToDocuments(documents: DteDocument[]): Promise<DteDocument[]> {
  if (documents.length === 0) return documents;

  const dteNumbers = documents.map((d) => d.codigo_generacion);

  // Fetch from dte_documents to get json/pdf paths
  const { data: dbDocs, error } = await supabase
    .from('dte_documents')
    .select('dte_number, json_bucket, json_path, pdf_bucket, pdf_path')
    .in('dte_number', dteNumbers);

  if (error || !dbDocs) return documents;

  // Map by dte_number
  const docsMap = new Map<string, any>();
  dbDocs.forEach(doc => {
    docsMap.set(doc.dte_number, doc);
  });

  return Promise.all(
    documents.map(async (doc) => {
      const dbDoc = docsMap.get(doc.codigo_generacion);
      if (!dbDoc) return doc;
      
      const files = await createDteSignedUrls(dbDoc).catch(() => null);
      return {
        ...doc,
        files,
      };
    })
  );
}

export const dteService = {
  async getDocuments(filters: DteQueryFilters = {}): Promise<DteListResponse> {
    if (USE_MOCK) {
      return filterMockDocuments(filters);
    }

    let query = supabase
      .from('dtes')
      .select('*', { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      const isValid = filters.status === 'valid';
      query = query.eq('es_valido', isValid);
    }

    if (filters.search) {
      const term = filters.search.trim();
      query = query.or(`emisor.ilike.%${term}%,receptor.ilike.%${term}%,numero_dte.ilike.%${term}%`);
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    query = query
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .range(start, end);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const mappedDocs = (data || []).map(mapDteRow);
    const docsWithFiles = await attachFilesToDocuments(mappedDocs);

    return {
      data: docsWithFiles,
      total: count || 0,
    };
  },

  async getDocumentById(id: string): Promise<DteDocument> {
    if (USE_MOCK) {
      const doc = MOCK_DTE_DOCUMENTS.find((d) => d.id === id);
      if (!doc) throw new Error('DTE not found');
      return doc;
    }

    const { data, error } = await supabase
      .from('dtes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    const mapped = mapDteRow(data);
    const withFiles = await attachFilesToDocuments([mapped]);
    return withFiles[0];
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK) {
      return computeDashboardStats(MOCK_DTE_DOCUMENTS);
    }

    const { data, error } = await supabase
      .from('dtes')
      .select('monto_total, es_valido');

    if (error) {
      throw error;
    }

    const totalProcessed = data ? data.length : 0;
    const errorCount = data ? data.filter(d => !d.es_valido).length : 0;
    const totalAuditedAmount = data ? data.reduce((acc, curr) => acc + (curr.monto_total || 0), 0) : 0;
    const successRate = totalProcessed > 0 ? ((totalProcessed - errorCount) / totalProcessed) * 100 : 100;

    return {
      totalProcessed,
      errorCount,
      totalAuditedAmount,
      successRate,
    };
  },

  async getProcessingVolume(): Promise<ProcessingVolumePoint[]> {
    if (USE_MOCK) {
      return computeProcessingVolume(MOCK_DTE_DOCUMENTS);
    }

    const { data, error } = await supabase
      .from('dtes')
      .select('fecha, es_valido')
      .order('fecha', { ascending: true });

    if (error) {
      throw error;
    }

    const groups: Record<string, { count: number; validCount: number; invalidCount: number }> = {};
    
    (data || []).forEach(row => {
      const dateStr = row.fecha ? new Date(row.fecha).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (!groups[dateStr]) {
        groups[dateStr] = { count: 0, validCount: 0, invalidCount: 0 };
      }
      groups[dateStr].count += 1;
      if (row.es_valido) {
        groups[dateStr].validCount += 1;
      } else {
        groups[dateStr].invalidCount += 1;
      }
    });

    return Object.entries(groups).map(([date, vals]) => ({
      date,
      count: vals.count,
      validCount: vals.validCount,
      invalidCount: vals.invalidCount,
    }));
  },

  async deleteDocument(id: string): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    const { error } = await supabase
      .from('dtes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async checkDuplicate(userId: string, dteNumber: string): Promise<boolean> {
    const cleanNumber = dteNumber
      .replace(/\s*\(\d+\)\s*$/, "")
      .replace(/\s*-\s*copia\s*$/i, "")
      .replace(/\s*copia\s*$/i, "")
      .replace(/\s*\(copy\)\s*$/i, "")
      .trim();

    if (!cleanNumber) return false;

    if (USE_MOCK) {
      const term = cleanNumber.toLowerCase();
      return MOCK_DTE_DOCUMENTS.some(
        (doc) => 
          doc.codigo_generacion.trim().toLowerCase() === term ||
          doc.id.trim().toLowerCase() === term
      );
    }

    try {
      // 1. Check in 'dtes' table (numero_dte)
      const { data: dteData } = await supabase
        .from('dtes')
        .select('id')
        .eq('user_id', userId)
        .ilike('numero_dte', cleanNumber)
        .maybeSingle();

      if (dteData) return true;

      // 2. Check in 'dte_documents' table (dte_number)
      const { data: docData } = await supabase
        .from('dte_documents')
        .select('id')
        .eq('taxpayer_id', userId)
        .ilike('dte_number', cleanNumber)
        .maybeSingle();

      if (docData) return true;

      // 3. Check in 'dte_documents' table (pdf_path)
      const { data: pathData } = await supabase
        .from('dte_documents')
        .select('id')
        .eq('taxpayer_id', userId)
        .like('pdf_path', `%${cleanNumber}%`)
        .maybeSingle();

      if (pathData) return true;
    } catch (err) {
      console.error('Error in checkDuplicate query:', err);
    }

    return false;
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
