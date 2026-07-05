import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChartNoAxesColumnIncreasing,
  CircleDollarSign,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

const auditSignals: Array<{ label: string; value: string; icon: LucideIcon }> = [
  { label: 'DTEs procesados', value: '48', icon: FileCheck2 },
  { label: 'Tasa válida', value: '79.2%', icon: ChartNoAxesColumnIncreasing },
  { label: 'Monto auditado', value: '$449K', icon: CircleDollarSign },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, signup, activateDemoMode } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo =
    (location.state as LoginLocationState | null)?.from?.pathname ?? '/';
  const isSignup = authMode === 'signup';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await login({ email, password });
        navigate(redirectTo, { replace: true });
      } else {
        if (!nombre || !email || !empresa || !password || !confirmPassword) {
          throw new Error('Todos los campos son obligatorios.');
        }
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
        await signup({ email, password, nombre, empresa });
        setSuccessMessage('Registro completado. Revisa tu correo para confirmar la cuenta.');
        setNombre('');
        setEmpresa('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (loginError: any) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'No se pudo completar la solicitud.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBypass = () => {
    activateDemoMode();
  };

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(460px,0.92fr)]">
        <section className="relative hidden overflow-hidden bg-[#08111f] text-white lg:block">
          <div className="absolute inset-0 tp-grid opacity-30" />
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent),var(--color-success))]" />

          <div className="relative flex min-h-screen flex-col justify-between px-12 py-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-[3px] border-2 border-[#08111f] bg-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">TaxPilot</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
                    Aseguramiento DTE
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-[6px] border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100">
                  <BadgeCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  Espacio empresarial de validación tributaria
                </div>
                <h1 className="text-5xl font-semibold leading-[1.04] tracking-normal">
                  Audita evidencia DTE con claridad, control y velocidad.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                  TaxPilot centraliza documentos tributarios electrónicos,
                  excepciones de validación y evidencia fiscal para que los
                  equipos auditores avancen del ingreso al reporte de cumplimiento
                  sin perder contexto.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.25)] backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Lote fiscal actual
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Sala de control de validación
                    </p>
                  </div>
                  <span className="rounded-[6px] border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                    Activo
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {auditSignals.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-[6px] border border-white/10 bg-white/[0.055] p-3"
                    >
                      <Icon className="h-4 w-4 text-cyan-200" />
                      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                        {value}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
                <ShieldCheck className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-[3px] border-2 border-white bg-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-base font-semibold">TaxPilot</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Aseguramiento DTE
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
              <div className="border-b border-[var(--color-border)] p-6">
                <div className="inline-flex rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                  {(['login', 'signup'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAuthMode(mode);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className={[
                        'h-8 rounded-[5px] px-3 text-xs font-semibold transition-colors',
                        authMode === mode
                          ? 'bg-white text-[var(--color-primary)] shadow-sm'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                      ].join(' ')}
                    >
                      {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                    </button>
                  ))}
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-normal text-[var(--color-foreground)]">
                  {isSignup ? 'Crear acceso al espacio de auditoría' : 'Ingresar a TaxPilot'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {isSignup
                    ? 'Registra un perfil de auditor conectado a tu organización.'
                    : 'Continúa a la consola de validación DTE y evidencia de auditoría.'}
                </p>
              </div>

              <form className="grid gap-4 p-6" onSubmit={handleSubmit}>
                {isSignup && (
                  <>
                    <div>
                      <label htmlFor="nombre" className="text-sm font-semibold text-[var(--color-foreground-soft)]">
                        Nombre completo
                      </label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <input
                          id="nombre"
                          type="text"
                          required
                          value={nombre}
                          onChange={(event) => setNombre(event.target.value)}
                          placeholder="Ana Martínez"
                          className="h-11 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="empresa" className="text-sm font-semibold text-[var(--color-foreground-soft)]">
                        Organización
                      </label>
                      <div className="relative mt-2">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <input
                          id="empresa"
                          type="text"
                          required
                          value={empresa}
                          onChange={(event) => setEmpresa(event.target.value)}
                          placeholder="Grupo Fiscal S.A."
                          className="h-11 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="text-sm font-semibold text-[var(--color-foreground-soft)]">
                    Correo electrónico
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="auditor@company.com"
                      className="h-11 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-semibold text-[var(--color-foreground-soft)]">
                    Contraseña
                  </label>
                  <div className="relative mt-2">
                    <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="h-11 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-11 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[5px] text-[var(--color-muted)] transition-colors hover:bg-white hover:text-[var(--color-foreground)]"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isSignup && (
                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--color-foreground-soft)]">
                      Confirmar contraseña
                    </label>
                    <div className="relative mt-2">
                      <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirma tu contraseña"
                        className="h-11 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-[6px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-strong)] disabled:opacity-70"
                >
                  {isSubmitting ? 'Procesando...' : isSignup ? 'Crear cuenta' : 'Ingresar'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="border-t border-[var(--color-border)] px-6 py-4">
                <button
                  type="button"
                  onClick={handleBypass}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-foreground-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Ver espacio demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
