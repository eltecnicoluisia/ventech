'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'V-11111111', name: 'Dueño del Sistema', role: 'SUPERADMIN' as const, color: 'text-amber-400' },
  { email: 'V-22222222', name: 'Administrador General', role: 'ADMIN' as const, color: 'text-blue-400' },
  { email: 'V-33333333', name: 'Gerente de Tienda', role: 'MANAGER' as const, color: 'text-violet-400' },
  { email: 'V-44444444', name: 'Cajero Principal', role: 'CASHIER' as const, color: 'text-emerald-400' },
  { email: 'V-55555555', name: 'Almacenista', role: 'INVENTORY' as const, color: 'text-cyan-400' },
  { email: 'V-66666666', name: 'Auditor de Cuentas', role: 'AUDITOR' as const, color: 'text-red-400' },
];

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  CASHIER: 'Cajero / POS',
  INVENTORY: 'Almacén / Inventario',
  AUDITOR: 'Auditor',
};

export default function LoginPage() {
  const { login, user, isLoaded } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Buscar en cuentas demo (ignorar superadmin porque ahora es real)
      const demoAccount = DEMO_ACCOUNTS.find(a => a.role !== 'SUPERADMIN' && a.email === email.trim().toLowerCase());

      if (demoAccount && password.length >= 1) {
        login({
          id: `usr-${demoAccount.role.toLowerCase()}`,
          name: demoAccount.name,
          email: demoAccount.email,
          role: demoAccount.role,
          tenantId: 'default-tenant',
        });
        router.push('/');
        return;
      }

      // Si no es demo, intentar API real
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (res.ok) {
          const data = await res.json();
          login(data.user);
          router.push('/');
        } else {
          setError('Cédula o contraseña incorrectos. Verifica tus datos.');
        }
      } catch {
        setError('Cédula o contraseña incorrectos. Verifica tus datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    login({
      id: `usr-${account.role.toLowerCase()}`,
      name: account.name,
      email: account.email,
      role: account.role,
      tenantId: 'default-tenant',
    });
    router.push('/');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-zinc-200">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent border-r border-white/5">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/40">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">VENTECH</h1>
          <p className="text-xl text-blue-400 font-semibold mb-8">SISTEMA ERP</p>
          <p className="text-zinc-400 text-lg mb-10">Gestión total de tu empresa. POS Offline-First, Multimoneda BCV, Leyes Venezolanas.</p>
          <div className="grid grid-cols-3 gap-4">
            {['POS RÁPIDO', 'MULTIMONEDA', 'AUDITORÍA'].map(tag => (
              <div key={tag} className="glass-bevel p-3 text-center rounded-xl">
                <p className="text-xs font-bold text-zinc-300 tracking-wider">{tag}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">VENTECH ERP</h1>
              <p className="text-xs text-blue-400 font-semibold">SISTEMA DE GESTIÓN</p>
            </div>
          </div>

          <div className="glass-bevel rounded-2xl p-8">
            <div className="mb-8">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                <Lock className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Iniciar Sesión</h2>
              <p className="text-zinc-400 mt-1">Ingresa tus credenciales para acceder al sistema.</p>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Cédula de Usuario</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="V-12345678"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-zinc-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Ingresar al Sistema'}
              </button>
            </form>

            {/* Quick access demo */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs font-semibold text-zinc-500 mb-3 tracking-wider uppercase">Acceso Rápido (Demo)</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.filter(acc => acc.role !== 'SUPERADMIN').map(acc => (
                  <button
                    key={acc.role}
                    onClick={() => quickLogin(acc)}
                    type="button"
                    className="text-left p-2.5 bg-black/40 border border-white/5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <p className={`text-xs font-bold ${acc.color}`}>{ROLE_LABELS[acc.role]}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{acc.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
