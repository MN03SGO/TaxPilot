import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Download,
  Eye,
  Filter,
  LogOut,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { DteDetailsModal } from '@/components/dashboard/DteDetailsModal';
import { ProcessingVolumeChart } from '@/components/dashboard/ProcessingVolumeChart';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { useAuth } from '@/hooks/useAuth';
import {
  useDashboardStats,
  useDteDocuments,
  useProcessingVolume,
} from '@/hooks/useDteDocuments';
import { dteService } from '@/services/dteService';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '@/lib/formatters';
import type { DashboardStats, DteDocument, ProcessingVolumePoint } from '@/types/dte';

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />
        <p className="text-sm font-medium text-[var(--color-muted)]">{message}</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-[var(--color-danger-soft)] p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-white text-[var(--color-danger)]">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-danger)]">
            No se pudieron cargar los datos del dashboard
          </h2>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

function sparklineFor(
  data: ProcessingVolumePoint[],
  selector: (point: ProcessingVolumePoint) => number,
) {
  return data.slice(-14).map(selector);
}

function amountBarsFor(documents: DteDocument[]) {
  return documents
    .slice(0, 12)
    .reverse()
    .map((document) => document.monto_total);
}

function firstName(name?: string) {
  return name?.split(' ').filter(Boolean)[0] ?? 'Auditor';
}

function todayLabel() {
  const formattedDate = new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return `Hoy, ${formattedDate}`.replace(/\s/g, '\u00a0');
}

function DashboardHeader() {
  const { user, logout, isDemo } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const displayName = user?.name ?? 'Auditor';

  return (
    <header className="relative z-40 flex w-full max-w-full min-w-0 flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between tp-animate-in">
      <div className="w-full max-w-full min-w-0">
        <h1 className="text-2xl font-semibold tracking-normal text-[var(--color-foreground)] sm:text-3xl">
          Buenos días, {firstName(displayName)}
        </h1>
        <p className="mt-2 max-w-full text-base leading-6 text-[var(--color-muted)]">
          Esto es lo que está pasando hoy con tus auditorías DTE.
        </p>
      </div>

      <div className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center 2xl:w-auto 2xl:flex-nowrap 2xl:justify-end">
        <div className="relative w-full max-w-full min-w-0 sm:w-[300px] 2xl:w-[360px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            type="search"
            placeholder="Buscar cualquier cosa..."
            className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-white pl-10 pr-12 text-sm text-[var(--color-foreground)] shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[5px] border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-muted)]">
            Ctrl K
          </span>
        </div>

        <button
          type="button"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-white text-[var(--color-foreground-soft)] shadow-sm hover:border-[var(--color-primary)]"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--color-primary)] tp-pulse-dot" />
        </button>

        <div className="relative w-full max-w-full min-w-0 sm:w-auto sm:shrink-0">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((current) => !current)}
            className="flex h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-[8px] border border-[var(--color-border)] bg-white px-3 text-left shadow-sm transition-colors hover:border-[var(--color-primary)] sm:w-[220px] sm:max-w-[260px]"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
              {user?.initials ?? 'TP'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                {displayName}
              </p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {isDemo ? 'Auditor demo' : user?.role ?? 'Auditor'}
              </p>
            </div>
            <ChevronDown
              className={[
                'h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform',
                isUserMenuOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {isUserMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-[100] w-[280px] overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] tp-animate-scale"
            >
              <div className="border-b border-[var(--color-border)] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                    {user?.initials ?? 'TP'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      {user?.email ?? 'Sesión demo local'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="flex h-10 w-full items-center gap-2 rounded-[6px] px-3 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-full max-w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white px-3 text-sm font-semibold leading-none text-[var(--color-foreground-soft)] shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:w-[188px]"
          style={{ whiteSpace: 'nowrap' }}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <span className="min-w-0 truncate">{todayLabel()}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
        </button>
      </div>
    </header>
  );
}

function StatusDistribution({ stats }: { stats: DashboardStats }) {
  const validCount = Math.max(stats.totalProcessed - stats.errorCount, 0);
  const invalidCount = stats.errorCount;
  const statusRows = [
    { label: 'Válidos', value: validCount, color: '#059669' },
    { label: 'Inválidos', value: invalidCount, color: '#DC2626' },
    { label: 'Pendientes', value: 0, color: '#F59E0B' },
  ];
  const chartData = statusRows.filter((row) => row.value > 0);

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] tp-animate-left tp-delay-3 tp-hover-lift">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          Distribución de estados
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Últimos 30 días</p>
      </div>

      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                innerRadius={58}
                outerRadius={78}
                paddingAngle={2}
                stroke="white"
                strokeWidth={4}
                animationBegin={220}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)]">Total</p>
              <p className="text-2xl font-semibold tabular-nums text-[var(--color-foreground)]">
                {formatNumber(stats.totalProcessed)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {statusRows.map((row) => {
            const percent =
              stats.totalProcessed > 0 ? (row.value / stats.totalProcessed) * 100 : 0;

            return (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground-soft)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                  {formatNumber(row.value)}
                  <span className="ml-1 font-medium text-[var(--color-muted)]">
                    ({percent.toFixed(1)}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RecentAlerts({ documents }: { documents: DteDocument[] }) {
  const invalidDocuments = documents.filter((document) => !document.es_valido);
  const highExposure = [...invalidDocuments].sort((a, b) => b.monto_total - a.monto_total)[0];
  const latestInvalid = invalidDocuments[0];
  const alerts = [
    highExposure
      ? {
          title: 'Alta exposición detectada',
          detail: highExposure.emisor_nombre,
          time: '2 min',
          icon: TriangleAlert,
          className: 'bg-red-50 text-red-600',
        }
      : null,
    latestInvalid
      ? {
          title: 'Validación fallida',
          detail: latestInvalid.observaciones ?? latestInvalid.codigo_generacion,
          time: '15 min',
          icon: AlertCircle,
          className: 'bg-amber-50 text-amber-600',
        }
      : null,
    {
      title: 'Reglas DTE actualizadas',
      detail: 'Versión 3.0',
      time: '1 h',
      icon: ShieldCheck,
      className: 'bg-blue-50 text-[var(--color-primary)]',
    },
  ].filter(Boolean);

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] tp-animate-left tp-delay-4 tp-hover-lift">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          Alertas recientes
        </h2>
        <Link to="/audit" className="text-xs font-semibold text-[var(--color-primary)]">
          Ver todo
        </Link>
      </div>

      <div className="mt-5 grid gap-4">
        {alerts.map((alert) => {
          if (!alert) return null;
          const Icon = alert.icon;

          return (
            <div key={alert.title} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 tp-animate-in">
              <div className={`flex h-10 w-10 items-center justify-center rounded-[6px] ${alert.className}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                  {alert.title}
                </p>
                <p className="truncate text-xs text-[var(--color-muted)]">{alert.detail}</p>
              </div>
              <span className="text-xs text-[var(--color-muted)]">{alert.time}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivityStatus({ document }: { document: DteDocument }) {
  return (
    <span
      className={[
        'inline-flex rounded-[5px] border px-2 py-1 text-xs font-semibold',
        document.es_valido
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700',
      ].join(' ')}
    >
      {document.es_valido ? 'Válido' : 'Inválido'}
    </span>
  );
}

function RecentAuditActivity({
  documents,
  onViewDetails,
  onDeleteSuccess,
}: {
  documents: DteDocument[];
  onViewDetails: (document: DteDocument) => void;
  onDeleteSuccess: () => void;
}) {
  const rows = documents.slice(0, 5);

  async function handleDelete(document: DteDocument) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este DTE permanentemente?')) {
      return;
    }

    try {
      await dteService.deleteDocument(document.id);
      onDeleteSuccess();
    } catch (error) {
      console.error('No se pudo eliminar el documento:', error);
      alert('Error al intentar eliminar el DTE.');
    }
  }

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.035)] tp-animate-in tp-delay-5">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">
            Actividad reciente de auditoría
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Últimos resultados de validación y procesamiento DTE
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-40 rounded-[6px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <Link
            to="/audit"
            className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-foreground-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto tp-scrollbar">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              <th className="px-5 py-3">Número DTE</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Proveedor</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Monto</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((document) => (
              <tr key={document.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-[var(--color-foreground)]">
                  {document.codigo_generacion || document.id}
                </td>
                <td className="px-5 py-3 text-[var(--color-foreground-soft)]">
                  {formatDate(document.fecha_emision)}
                </td>
                <td className="px-5 py-3 text-[var(--color-foreground-soft)]">
                  {document.emisor_nombre}
                </td>
                <td className="px-5 py-3">
                  <ActivityStatus document={document} />
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums text-[var(--color-foreground)]">
                  {formatCurrency(document.monto_total, document.moneda)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(document)}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      aria-label="Ver detalle"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!document.files?.pdfUrl && !document.files?.jsonUrl}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40"
                      aria-label="Descargar evidencia"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(document)}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label="Eliminar DTE"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[var(--color-border)] p-4 text-center">
        <Link
          to="/audit"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          Ver todos los registros de auditoría
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </div>
    </section>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const statsQuery = useDashboardStats();
  const volumeQuery = useProcessingVolume();
  const documentsQuery = useDteDocuments({ pageSize: 50 });
  const [selectedDte, setSelectedDte] = useState<DteDocument | null>(null);

  const isLoading =
    statsQuery.isLoading || volumeQuery.isLoading || documentsQuery.isLoading;
  const error = statsQuery.error ?? volumeQuery.error ?? documentsQuery.error;

  const stats = statsQuery.data;
  const volume = volumeQuery.data ?? [];
  const documents = documentsQuery.data?.data ?? [];

  function refreshDteQueries() {
    queryClient.invalidateQueries({ queryKey: ['dte'] });
  }

  return (
    <>
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-7 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto grid max-w-[1480px] min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
          <DashboardHeader />

          {isLoading && <LoadingState message="Cargando espacio de auditoría..." />}

          {error && !isLoading && (
            <ErrorState message={error.message ?? 'No se pudieron cargar los datos del panel'} />
          )}

          {!isLoading && !error && stats && volumeQuery.data && documentsQuery.data && (
            <>
              <section className="grid w-full max-w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4 tp-kpi-grid">
                <SummaryCard
                  title="DTEs procesados"
                  value={formatNumber(stats.totalProcessed)}
                  description="Documentos indexados"
                  icon={ClipboardList}
                  accent="primary"
                  sparkline={sparklineFor(volume, (point) => point.count)}
                  trend={{ value: '+12%', direction: 'up', tone: 'positive', label: 'vs ayer' }}
                />
                <SummaryCard
                  title="Errores detectados"
                  value={formatNumber(stats.errorCount)}
                  description="Requieren revisión"
                  icon={TriangleAlert}
                  accent="danger"
                  sparkline={sparklineFor(volume, (point) => point.invalidCount)}
                  trend={{ value: '-3%', direction: 'down', tone: 'positive', label: 'vs ayer' }}
                />
                <SummaryCard
                  title="Monto auditado"
                  value={formatCurrency(stats.totalAuditedAmount)}
                  description="Cobertura validada"
                  icon={CircleDollarSign}
                  accent="success"
                  sparkline={amountBarsFor(documents)}
                  trend={{ value: '+8.1%', direction: 'up', tone: 'positive', label: 'vs ayer' }}
                />
                <SummaryCard
                  title="Tasa de éxito"
                  value={formatPercent(stats.successRate)}
                  description="Aprobación por reglas"
                  icon={ShieldCheck}
                  accent="purple"
                  sparkline={sparklineFor(volume, (point) =>
                    point.count > 0 ? (point.validCount / point.count) * 100 : 100,
                  )}
                  trend={{ value: '+1.2%', direction: 'up', tone: 'positive', label: 'vs ayer' }}
                />
              </section>

              <section className="grid w-full max-w-full min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)] 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)]">
                <ProcessingVolumeChart data={volume} />
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
                  <StatusDistribution stats={stats} />
                  <RecentAlerts documents={documents} />
                </div>
              </section>

              <RecentAuditActivity
                documents={documents}
                onViewDetails={setSelectedDte}
                onDeleteSuccess={refreshDteQueries}
              />
            </>
          )}
        </div>
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
