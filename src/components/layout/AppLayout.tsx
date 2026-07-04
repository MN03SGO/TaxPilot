import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
