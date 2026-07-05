import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { DteDetailsModal } from '@/components/dashboard/DteDetailsModal';
import { useDteDocuments } from '@/hooks/useDteDocuments';
import type { DteStatus, DteDocument } from '@/types/dte';

export function Audit() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DteStatus | 'all'>('all');
  const [selectedDte, setSelectedDte] = useState<DteDocument | null>(null);

  const { data, isLoading, error, refetch } = useDteDocuments({
    search: search || undefined,
    status,
  });

  return (
    <>
      <Topbar
        title="Audit"
        subtitle="Full DTE document audit log"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm text-[var(--color-muted)]">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as DteStatus | 'all')}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          >
            <option value="all">All</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>

        {isLoading && (
          <p className="py-16 text-center text-sm text-[var(--color-muted)]">
            Loading audit records...
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-muted)] p-6 text-center text-sm text-[var(--color-error)]">
            {error.message}
          </p>
        )}

        {data && (
          <AuditTable
            documents={data.data}
            onViewDetails={(doc) => setSelectedDte(doc)}
            onDeleteSuccess={() => refetch()}
          />
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
