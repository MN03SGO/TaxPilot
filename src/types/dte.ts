/** DTE validation status derived from es_valido */
export type DteStatus = 'valid' | 'invalid';

/** Core DTE document shape aligned with Supabase dte_documents table */
export interface DteDocument {
  id: string;
  codigo_generacion: string;
  tipo_dte: string;
  emisor_nombre: string;
  emisor_nit: string;
  receptor_nombre: string | null;
  fecha_emision: string;
  monto_total: number;
  moneda: string;
  es_valido: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

/** Aggregated dashboard metrics */
export interface DashboardStats {
  totalProcessed: number;
  errorCount: number;
  totalAuditedAmount: number;
  successRate: number;
}

/** Time-series data point for processing volume chart */
export interface ProcessingVolumePoint {
  date: string;
  count: number;
  validCount: number;
  invalidCount: number;
}

/** API list response wrapper */
export interface DteListResponse {
  data: DteDocument[];
  total: number;
}

/** Query filters for audit table */
export interface DteQueryFilters {
  search?: string;
  status?: DteStatus | 'all';
  page?: number;
  pageSize?: number;
}

/** Maps es_valido boolean to display status */
export function getDteStatus(document: DteDocument): DteStatus {
  return document.es_valido ? 'valid' : 'invalid';
}
