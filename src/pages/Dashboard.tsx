import { useState } from 'react';
import { FileText, AlertCircle, DollarSign, CheckCircle2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { ProcessingVolumeChart } from '@/components/dashboard/ProcessingVolumeChart';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { DteDetailsModal } from '@/components/dashboard/DteDetailsModal';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDashboardStats,
  useProcessingVolume,
  useDteDocuments,
} from '@/hooks/useDteDocuments';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/formatters';
import type { DteDocument } from '@/types/dte';
import { useAuth } from '@/hooks/useAuth';

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800" />
        <p className="text-sm text-[var(--color-muted)]">{message}</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-muted)] p-6 text-center">
      <p className="text-sm font-medium text-[var(--color-error)]">{message}</p>
    </div>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const statsQuery = useDashboardStats();
  const volumeQuery = useProcessingVolume();
  const documentsQuery = useDteDocuments({ pageSize: 10 });
  
  const { user } = useAuth();

  const [selectedDte, setSelectedDte] = useState<DteDocument | null>(null);

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['processing-volume'] });
    queryClient.invalidateQueries({ queryKey: ['dte-documents'] });
  };

  const isLoading =
    statsQuery.isLoading || volumeQuery.isLoading || documentsQuery.isLoading;

  const error =
    statsQuery.error ?? volumeQuery.error ?? documentsQuery.error;

  return (
    <>
      <Topbar
        title={`Buenos días, ${user?.name ?? 'Auditor'}`}
        subtitle="Esto es lo que está pasando hoy con tus auditorías DTE."
      />

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading && <LoadingState message="Loading dashboard data..." />}

        {error && !isLoading && (
          <ErrorState message={error.message ?? 'Failed to load dashboard data'} />
        )}

        {!isLoading && !error && statsQuery.data && volumeQuery.data && documentsQuery.data && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="DTEs procesados"
                value={formatNumber(statsQuery.data.totalProcessed)}
                icon={FileText}
                description="Documentos indexados"
                trend={{ value: '+12% vs ayer', direction: 'up' }}
              />
              <SummaryCard
                title="Errores detectados"
                value={formatNumber(statsQuery.data.errorCount)}
                icon={AlertCircle}
                accent="danger"
                description="Requieren revisión"
                trend={{ value: '-3% vs ayer', direction: 'down' }}
              />
              <SummaryCard
                title="Monto auditado"
                value={formatCurrency(statsQuery.data.totalAuditedAmount)}
                icon={DollarSign}
                description="Cobertura validada"
                trend={{ value: '+8.1% vs ayer', direction: 'up' }}
              />
              <SummaryCard
                title="Tasa de éxito"
                value={formatPercent(statsQuery.data.successRate)}
                icon={CheckCircle2}
                accent="success"
                description="Aprobación por reglas"
                trend={{ value: '+1.2% vs ayer', direction: 'up' }}
              />
            </section>

            <section>
              <ProcessingVolumeChart data={volumeQuery.data} />
            </section>

            <section>
              <AuditTable
                documents={documentsQuery.data.data}
                onViewDetails={(doc) => {
                  setSelectedDte(doc);
                }}
                onDeleteSuccess={handleDeleteSuccess}
              />
            </section>
          </div>
        )}
      </main>

      {selectedDte && (
        <DteDetailsModal
          document={selectedDte}
          onClose={() => setSelectedDte(null)}
        />
      )}
    </>
  );
}
