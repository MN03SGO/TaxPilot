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
        title="Dashboard"
        subtitle="DTE audit overview and processing metrics"
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
                title="Total DTEs Processed"
                value={formatNumber(statsQuery.data.totalProcessed)}
                icon={FileText}
                trend={{ value: '+12%', direction: 'up' }}
              />
              <SummaryCard
                title="Error Count"
                value={formatNumber(statsQuery.data.errorCount)}
                icon={AlertCircle}
                accent="danger"
                trend={{ value: '-3%', direction: 'down' }}
              />
              <SummaryCard
                title="Total Audited Amount"
                value={formatCurrency(statsQuery.data.totalAuditedAmount)}
                icon={DollarSign}
              />
              <SummaryCard
                title="Success Rate"
                value={formatPercent(statsQuery.data.successRate)}
                icon={CheckCircle2}
                accent="success"
                trend={{ value: '+1.2%', direction: 'up' }}
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
