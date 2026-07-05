import { Outlet } from 'react-router-dom';
import { MobileNav, Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { AssistantBubble } from '@/components/layout/AssistantBubble';

export function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-foreground)]">
      <Sidebar user={user} />
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[280px]">
        <Outlet context={{ user }} />
        <AssistantBubble />
      </div>
      <MobileNav />
    </div>
  );
}
