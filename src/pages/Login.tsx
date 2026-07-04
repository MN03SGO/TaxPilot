import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
  Building,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

const auditSignals = [
  { label: 'DTEs procesados', value: '48' },
  { label: 'Tasa válida', value: '79.2%' },
  { label: 'Alertas abiertas', value: '10' },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, signup, activateDemoMode } = useAuth();
  
  // Toggle Mode
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [mailConectado, setMailConectado] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo =
    (location.state as LoginLocationState | null)?.from?.pathname ?? '/';

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
        if (!nombre || !email || !empresa || !mailConectado || !password || !confirmPassword) {
          throw new Error('Todos los campos son obligatorios.');
        }
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
        await signup({ email, password, nombre, empresa, mailConectado });
        setSuccessMessage('Registro exitoso. Revisa tu correo de confirmación para activar tu cuenta.');
        // Reset registration fields
        setNombre('');
        setEmpresa('');
        setMailConectado('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (loginError: any) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'No se pudo procesar la solicitud.',
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
      <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
        {/* Left Banner Section */}
        <section className="hidden overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#123c69_52%,#0f766e_100%)] px-12 py-10 text-white lg:flex">
          <div className="flex w-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[var(--color-brand-900)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">TaxPilot</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                    DTE Audit
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-300" />
                  Control fiscal en tiempo real
                </div>
                <h1 className="text-5xl font-semibold leading-[1.05] tracking-normal">
                  Auditoría DTE con trazabilidad ejecutiva.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
                  Centraliza documentos tributarios electrónicos, alertas de
                  validación y evidencia operativa en una experiencia sobria y
                  rápida.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Resumen
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      Lote fiscal actual
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-neutral-900">
                    Activo
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {auditSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-lg border border-white/10 bg-white/[0.07] p-3"
                    >
                      <p className="text-xl font-semibold">{signal.value}</p>
                      <p className="mt-1 text-[11px] leading-4 text-white/55">
                        {signal.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form Section */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold">TaxPilot</p>
                <p className="text-xs text-[var(--color-muted)]">DTE Audit</p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
              <div className="mb-7">
                <p className="text-sm font-medium text-[var(--color-accent)]">
                  {authMode === 'login' ? 'Acceso seguro' : 'Crear cuenta'}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--color-foreground)]">
                  {authMode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {authMode === 'login' 
                    ? 'Ingresa al panel de auditoría fiscal de TaxPilot.' 
                    : 'Regístrate para auditar tus documentos DTE.'}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label
                        htmlFor="nombre"
                        className="text-sm font-medium text-[var(--color-foreground)]"
                      >
                        Nombre Completo
                      </label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <input
                          id="nombre"
                          type="text"
                          required
                          value={nombre}
                          onChange={(event) => setNombre(event.target.value)}
                          placeholder="Juan Pérez"
                          className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="empresa"
                        className="text-sm font-medium text-[var(--color-foreground)]"
                      >
                        Empresa
                      </label>
                      <div className="relative mt-2">
                        <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <input
                          id="empresa"
                          type="text"
                          required
                          value={empresa}
                          onChange={(event) => setEmpresa(event.target.value)}
                          placeholder="Mi Empresa S.A."
                          className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="mailConectado"
                        className="text-sm font-medium text-[var(--color-foreground)]"
                      >
                        Correo Conectado
                      </label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <input
                          id="mailConectado"
                          type="email"
                          required
                          value={mailConectado}
                          onChange={(event) => setMailConectado(event.target.value)}
                          placeholder="empresa@taxpilot.com"
                          className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-[var(--color-foreground)]"
                  >
                    Correo Electrónico
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
                      placeholder="auditor@empresa.com"
                      className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-[var(--color-foreground)]"
                  >
                    Contraseña
                  </label>
                  <div className="relative mt-2">
                    <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-11 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-white hover:text-[var(--color-foreground)]"
                      aria-label={
                        showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-[var(--color-foreground)]"
                    >
                      Confirmar Contraseña
                    </label>
                    <div className="relative mt-2">
                      <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirma tu contraseña"
                        className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-[var(--color-error)]/25 bg-[var(--color-error-muted)] px-3 py-2 text-sm font-medium text-[var(--color-error)]">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-lg border border-green-500/25 bg-green-50/50 px-3 py-2 text-sm font-medium text-green-600">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting 
                    ? 'Procesando...' 
                    : (authMode === 'login' ? 'Ingresar' : 'Registrarse')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-4 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="hover:text-[var(--color-foreground)] underline transition-colors"
                >
                  {authMode === 'login' 
                    ? '¿No tienes cuenta? Regístrate' 
                    : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
                
                <button
                  type="button"
                  onClick={handleBypass}
                  className="hover:text-[var(--color-foreground)] underline transition-colors"
                >
                  Ver con Datos Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
