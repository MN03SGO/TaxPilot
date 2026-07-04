import type { DteDocument, DashboardStats, ProcessingVolumePoint } from '@/types/dte';

const EMITTERS = [
  'Distribuidora El Salvador S.A.',
  'Comercial La Unión',
  'Industrias San Miguel',
  'Grupo Alimenticio Centro',
  'Tecnología Digital SV',
  'Farmacias del Pacífico',
  'Constructora Horizonte',
  'Logística Express',
];

const OBSERVATIONS = [
  'NIT del emisor no coincide con registro MH',
  'Monto total no cuadra con suma de líneas',
  'Código de generación duplicado',
  'Fecha de emisión fuera del período fiscal',
  'Tipo de DTE no autorizado para el emisor',
  null,
  null,
  null,
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function generateId(index: number): string {
  return `DTE-${String(index + 1).padStart(5, '0')}`;
}

export const MOCK_DTE_DOCUMENTS: DteDocument[] = Array.from({ length: 48 }, (_, i) => {
  const es_valido = i % 5 !== 0;
  const days = Math.floor(i / 2);
  const monto = Math.round((1200 + i * 347.5) * 100) / 100;

  return {
    id: generateId(i),
    codigo_generacion: `GEN-${String(10000 + i).slice(-8)}`,
    tipo_dte: i % 3 === 0 ? '01' : i % 3 === 1 ? '03' : '05',
    emisor_nombre: EMITTERS[i % EMITTERS.length],
    emisor_nit: `0${61000000 + i * 1111}`,
    receptor_nombre: i % 4 === 0 ? null : 'Cliente Corporativo S.A. de C.V.',
    fecha_emision: daysAgo(days),
    monto_total: monto,
    moneda: 'USD',
    es_valido,
    observaciones: es_valido ? null : OBSERVATIONS[i % OBSERVATIONS.length],
    created_at: daysAgo(days),
    updated_at: daysAgo(days),
  };
});

export function computeDashboardStats(documents: DteDocument[]): DashboardStats {
  const totalProcessed = documents.length;
  const errorCount = documents.filter((d) => !d.es_valido).length;
  const totalAuditedAmount = documents.reduce((sum, d) => sum + d.monto_total, 0);
  const successRate =
    totalProcessed > 0
      ? Math.round(((totalProcessed - errorCount) / totalProcessed) * 1000) / 10
      : 0;

  return { totalProcessed, errorCount, totalAuditedAmount, successRate };
}

export function computeProcessingVolume(
  documents: DteDocument[],
): ProcessingVolumePoint[] {
  const byDate = new Map<string, ProcessingVolumePoint>();

  for (const doc of documents) {
    const date = doc.fecha_emision.slice(0, 10);
    const existing = byDate.get(date) ?? {
      date,
      count: 0,
      validCount: 0,
      invalidCount: 0,
    };

    existing.count += 1;
    if (doc.es_valido) {
      existing.validCount += 1;
    } else {
      existing.invalidCount += 1;
    }

    byDate.set(date, existing);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
