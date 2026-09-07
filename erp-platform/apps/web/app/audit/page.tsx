"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/UserContext";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  createdAt: string;
  oldData?: any;
  newData?: any;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit?limit=100');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-emerald-400 bg-emerald-400/10';
    if (action.includes('UPDATE')) return 'text-blue-400 bg-blue-400/10';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'text-red-400 bg-red-400/10';
    return 'text-zinc-400 bg-zinc-400/10';
  };

  const getActionLabel = (action: string) => {
    switch(action) {
      case 'CREATE_SALE': return 'Nueva Venta';
      case 'CANCEL_SALE': return 'Venta Anulada';
      case 'CREATE_PRODUCT': return 'Crear Producto';
      case 'UPDATE_PRODUCT': return 'Editar Producto';
      case 'DELETE_PRODUCT': return 'Eliminar Producto';
      default: return action;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto text-zinc-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Auditoría</h1>
          <p className="text-zinc-400 text-sm mt-1">Registro inmutable de actividades y operaciones críticas.</p>
        </div>
        <button onClick={fetchLogs} className="glass-icon p-3 rounded-xl hover:bg-white/10 transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="glass-panel border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Acción</th>
                <th className="px-6 py-4 font-semibold">Entidad Afectada</th>
                <th className="px-6 py-4 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-zinc-500">Cargando registros...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-zinc-500">No hay registros de auditoría aún.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-zinc-300 font-medium">{new Date(log.createdAt).toLocaleDateString('es-VE')}</div>
                      <div className="text-zinc-500 text-xs">{new Date(log.createdAt).toLocaleTimeString('es-VE')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{log.user?.name || 'Sistema'}</div>
                      <div className="text-zinc-500 text-xs">{log.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{log.entity}</div>
                      <div className="text-zinc-500 text-xs font-mono">{log.entityId}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
