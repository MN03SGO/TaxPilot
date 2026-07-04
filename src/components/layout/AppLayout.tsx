import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

export function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}
