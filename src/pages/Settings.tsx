import { Topbar } from '@/components/layout/Topbar';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <>
      <Topbar title="Settings" subtitle="Application preferences" />

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
            <SettingsIcon className="h-6 w-6 text-[var(--color-muted)]" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Settings
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            API configuration and notification preferences.
          </p>
        </div>
      </main>
    </>
  );
}
