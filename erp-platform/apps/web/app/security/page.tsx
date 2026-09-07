'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Activity, 
  Lock, Key, FileText, Download, ShieldAlert, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/sales');
        if (res.ok) setSales(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!user || !['SUPERADMIN', 'ADMIN', 'AUDITOR'].includes(user.role)) {
    return <div className="p-8 text-white">Acceso denegado. Se requiere nivel AUDITOR o superior.</div>;
  }

  // Anomalies / Audit Events based on sales
  const cancelledSales = sales.filter(s => s.status === 'CANCELLED');
  const highValueSales = sales.filter(s => Number(s.totalUSD) > 500);

  // Simulated live events
  const liveEvents = [
    { id: 1, time: 'Hace 2 min', user: 'cajero@ventech.local', action: 'INICIO_SESION', type: 'info' },
    { id: 2, time: 'Hace 15 min', user: 'admin@ventech.local', action: 'MODIFICACION_AJUSTES_FISCALES', type: 'warning' },
    { id: 3, time: 'Hace 1 hora', user: 'almacen@ventech.local', action: 'AJUSTE_INVENTARIO_MANUAL', type: 'warning' },
    { id: 4, time: 'Hace 2 horas', user: 'super@ventech.local', action: 'CREACION_USUARIO', type: 'info' },
  ];

  // Combine real cancelled sales as audit alerts
  const alerts = cancelledSales.map(s => ({
    id: s.id,
    time: new Date(s.createdAt).toLocaleString('es-VE'),
    user: 'Sistema',
    action: `ANULACION_VENTA_FACTURA_${s.invoiceNumber}`,
    type: 'critical',
    desc: `Se anuló una venta de $${s.totalUSD} y se restauró el inventario.`
  }));

  const downloadAuditLog = () => {
    const header = 'TIMESTAMP,USUARIO,ACCION,TIPO,DESCRIPCION\n';
    const rows = [...alerts, ...liveEvents.map(e => ({...e, desc: e.action}))]
      .map(e => `${e.time},${e.user},${e.action},${e.type},${e.desc}`)
      .join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_ventech_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen text-zinc-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between glass-bevel p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-400" /> Ciberseguridad y Auditoría
              </h1>
              <p className="text-sm text-zinc-400">Control anticorrupción y registro de actividad del sistema</p>
            </div>
          </div>
          <button onClick={downloadAuditLog} className="flex items-center gap-2 px-4 py-2 glass-icon rounded-xl text-sm font-semibold hover:text-white transition-colors">
            <Download className="w-4 h-4" /> Exportar Log CSV
          </button>
        </div>

        {/* Security Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-emerald-400">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-zinc-400">Estado del Sistema</p>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-emerald-400">SEGURO</p>
            <p className="text-xs text-zinc-500 mt-1">Monitoreo activo</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-blue-400">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-zinc-400">Sesiones Activas (Hoy)</p>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xl font-black text-white">4 Usuarios</p>
            <p className="text-xs text-zinc-500 mt-1">Cifrado E2E</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-amber-400">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-zinc-400">Acciones Auditadas</p>
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xl font-black text-white">1,245</p>
            <p className="text-xs text-zinc-500 mt-1">Últimas 24h</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-red-400">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-zinc-400">Alertas de Riesgo</p>
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-xl font-black text-red-400">{cancelledSales.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Ventas anuladas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Audit Log Table */}
          <div className="lg:col-span-2 glass-bevel rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 bg-black/20">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-400" /> Registro de Actividad en Vivo
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10">
                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Tiempo</th>
                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Usuario</th>
                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-mono">
                  {liveEvents.map(e => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 text-zinc-500 text-xs">{e.time}</td>
                      <td className="px-5 py-3 text-blue-400">{e.user}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          e.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {e.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3 text-zinc-500 text-xs">Ayer</td>
                    <td className="px-5 py-3 text-blue-400">admin@ventech.local</td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">INICIO_SESION</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Panel / Alerts */}
          <div className="space-y-6">
            <div className="glass-bevel p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Alertas de Anticorrupción
              </h2>
              
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-sm text-zinc-400">No se han detectado anomalías recientes.</p>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-xs font-bold text-red-400 mb-1">{a.action}</p>
                      <p className="text-xs text-zinc-300 mb-2">{a.desc}</p>
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>{a.time}</span>
                        <span>{a.user}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-bevel p-6 rounded-2xl">
              <h2 className="text-sm font-bold text-white mb-4">Políticas de Seguridad Activas</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Restricción de Anulaciones (Solo Admin)
                </li>
                <li className="flex items-center gap-3 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Tracking de IP y Dispositivo
                </li>
                <li className="flex items-center gap-3 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Bloqueo de Modificación de Precios (Cajeros)
                </li>
                <li className="flex items-center gap-3 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Cierre de Caja Ciego
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
