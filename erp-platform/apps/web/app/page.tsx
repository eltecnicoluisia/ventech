'use client';
import Link from 'next/link';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Package, Users, BarChart3, Shield, Zap,
  ArrowRight, Globe, Activity, LogOut, Settings, UserCog,
  TrendingUp, FileText, Lock
} from 'lucide-react';

const roleLabels: Record<string, string> = {
  SUPERADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  AUDITOR: 'Auditor',
  CASHIER: 'Cajero',
  INVENTORY: 'Almacenista',
};

const allModules = [
  {
    href: '/pos', icon: ShoppingCart, label: 'Punto de Venta',
    desc: 'POS ultra-rápido offline-first', color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER']
  },
  {
    href: '/inventory', icon: Package, label: 'Inventario',
    desc: 'Control de stock y series de productos', color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'INVENTORY']
  },
  {
    href: '/customers', icon: Users, label: 'Clientes (CRM)',
    desc: 'Gestión de clientes y crédito', color: 'text-violet-400',
    bg: 'bg-violet-400/10 border-violet-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'MANAGER']
  },
  {
    href: '/sales', icon: FileText, label: 'Historial de Ventas',
    desc: 'Facturas, reportes y anulaciones', color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER']
  },
  {
    href: '/analytics', icon: BarChart3, label: 'Analítica IA',
    desc: 'Reportes y KPIs en tiempo real', color: 'text-pink-400',
    bg: 'bg-pink-400/10 border-pink-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'AUDITOR']
  },
  {
    href: '/exchange', icon: Globe, label: 'Multimoneda BCV',
    desc: 'Tasa BCV + calculadora IGTF', color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CASHIER']
  },
  {
    href: '/security', icon: Shield, label: 'Ciberseguridad',
    desc: 'Auditoría y control anticorrupción', color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'AUDITOR']
  },
  {
    href: '/users', icon: UserCog, label: 'Gestión de Usuarios',
    desc: 'Roles, permisos y accesos', color: 'text-indigo-400',
    bg: 'bg-indigo-400/10 border-indigo-400/20',
    roles: ['SUPERADMIN', 'ADMIN']
  },
  {
    href: '/audit', icon: Activity, label: 'Registro de Auditoría',
    desc: 'Trazabilidad completa de operaciones', color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/20',
    roles: ['SUPERADMIN', 'ADMIN', 'AUDITOR']
  },
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-400 mb-4">Cargando sesión...</p>
          <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  const modules = allModules.filter(m => m.roles.includes(user.role));

  return (
    <div className="min-h-screen text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-50 p-3 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">VENTECH</h1>
              <p className="text-[10px] text-blue-400 font-semibold tracking-widest">SISTEMA ERP</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-300">SISTEMA ACTIVO</span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-white leading-tight">{user.name}</span>
              <span className="text-[11px] text-zinc-400 leading-tight">{user.email}</span>
              <span className="text-[10px] text-blue-400 font-bold tracking-wide">{roleLabels[user.role] || user.role}</span>
            </div>

            {(user.role === 'SUPERADMIN' || user.role === 'ADMIN') && (
              <Link href="/settings" className="w-9 h-9 glass-icon rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
            )}

            <button onClick={logout} className="w-9 h-9 glass-icon rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 pt-10 pb-24">
        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" />
            PLATAFORMA ERP · MULTIMONEDA BCV · LEYES VENEZOLANAS
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            GESTIÓN TOTAL DE TU <span className="text-blue-500">EMPRESA</span>
          </h2>
          <p className="text-base md:text-lg text-zinc-400 font-medium">
            POS Offline-First • IVA/IGTF Configurable • Auditoría Anticorrupción
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`group relative p-5 glass-bevel rounded-2xl border hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ${m.bg}`}
            >
              <div className="flex justify-between items-start mb-10">
                <div className={`w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center ${m.color}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${m.color}`} />
              </div>
              <h3 className={`text-base font-bold text-white mb-1 group-hover:${m.color.replace('text-', 'text-')} transition-colors`}>
                {m.label}
              </h3>
              <p className="text-xs text-zinc-500">{m.desc}</p>
            </Link>
          ))}
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-12 glass-bevel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-white">Sistema Seguro y Auditado</p>
              <p className="text-xs text-zinc-400">Anticorrupción • Registro de actividad • Roles de acceso</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-blue-400">{modules.length}</p>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-wider">MÓDULOS ACTIVOS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">VES+USD</p>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-wider">MULTIMONEDA</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-cyan-400">PWA</p>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-wider">OFFLINE-FIRST</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
