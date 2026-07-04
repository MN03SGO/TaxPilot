import { Topbar } from '@/components/layout/Topbar';
import { FileBarChart2 } from 'lucide-react';

export function Reports() {
  return (
    <>
      <Topbar title="Reports" subtitle="Export and compliance reports" />

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
            <FileBarChart2 className="h-6 w-6 text-[var(--color-muted)]" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Reports module
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Coming soon — PDF exports and compliance summaries.
          </p>
        </div>
      </main>
    </>
  );
}
