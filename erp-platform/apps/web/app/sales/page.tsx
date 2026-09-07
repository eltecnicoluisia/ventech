'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Search, Eye, EyeOff, X, Zap, ShieldAlert, CheckCircle, Lock, AlertTriangle } from 'lucide-react';

function fmtVES(n: number, decimals = 2): string {
  const [intPart, decPart] = n.toFixed(decimals).split('.');
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + (decPart ?? '00');
}
function fmtUSD(n: number, decimals = 2): string {
  return '$' + n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Auth Modal States
  const [authModal, setAuthModal] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const fetchSales = () => {
    setLoading(true);
    fetch('/api/sales', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setSales(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  const requireAdminAuth = (action: () => Promise<void>) => {
    // Para simplificar, abrimos siempre el modal en esta demo, 
    // a menos que ya estemos seguros del rol (aquí no importamos useAuth por ahora, 
    // pero podemos forzar el modal para seguridad).
    setPendingAction(() => action);
    setAuthModal(true);
    setAuthError('');
    setAuthUsername('');
    setAuthPassword('');
  };

  async function executeVoidSale() {
    if (!selected) return;
    try {
      const res = await fetch(`/api/sales/${selected.id}/cancel`, { method: 'PATCH' });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.message || 'Error al anular la venta', 'error');
        return;
      }
      showToast('Venta anulada y stock restaurado', 'success');
      setSelected(null);
      fetchSales();
    } catch (e) {
      showToast('Error de conexión', 'error');
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword) { setAuthError('Cédula y contraseña son requeridos'); return; }
    
    // Normalizar a V- si el usuario ingresó solo números
    const normalizedUsername = authUsername.toUpperCase().startsWith('V-') ? authUsername.toUpperCase() : `V-${authUsername}`;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedUsername, password: authPassword })
      });
      
      if (!res.ok) { setAuthError('Credenciales incorrectas'); return; }
      
      const data = await res.json();
      if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(data.user.role)) {
        setAuthError('Permisos insuficientes. Requiere Administrador o Gerente.');
        return;
      }
      
      setAuthModal(false);
      if (pendingAction) { await pendingAction(); setPendingAction(null); }
    } catch {
      setAuthError('Error de conexión con el servidor');
    }
  }

  const filtered = sales.filter(s =>
    s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.paymentMethod.toLowerCase().includes(search.toLowerCase()) ||
    s.status.toLowerCase().includes(search.toLowerCase())
  );

  const totalVentas = sales.filter(s => s.status === 'COMPLETED').reduce((a, s) => a + Number(s.totalUSD), 0);

  const inputClass = "w-full glass-icon rounded-xl px-4 py-3 text-sm text-zinc-200 font-bold placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600";

  return (
    <div className="min-h-screen text-zinc-200 p-2 sm:p-4">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-100' : 'bg-red-900/40 border-red-500/30 text-red-100'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
        </div>
      )}
      {/* Header */}
      <div className="glass-bevel px-4 sm:px-6 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/pos" className="glass-icon p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-400 drop-shadow-md" />
          <div>
            <h1 className="font-black text-engraved-light uppercase tracking-widest text-lg">Historial de Ventas</h1>
            <p className="text-xs font-bold text-engraved tracking-wide">Registro fiscal de todas las transacciones</p>
          </div>
        </div>
        <div className="sm:ml-auto flex-1 sm:flex-none w-full sm:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input className={inputClass + " pl-9"} placeholder="Buscar factura..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass-bevel px-5 py-4 flex items-center gap-4">
          <FileText className="w-6 h-6 text-blue-400 shrink-0" />
          <div><p className="text-2xl font-black text-engraved-light">{sales.length}</p><p className="text-[10px] font-black text-engraved uppercase tracking-widest">Total Facturas</p></div>
        </div>
        <div className="glass-bevel px-5 py-4 flex items-center gap-4">
          <FileText className="w-6 h-6 text-emerald-400 shrink-0" />
          <div><p className="text-2xl font-black text-emerald-400">{sales.filter(s => s.status === 'COMPLETED').length}</p><p className="text-[10px] font-black text-engraved uppercase tracking-widest">Completadas</p></div>
        </div>
        <div className="glass-bevel px-5 py-4 flex items-center gap-4">
          <FileText className="w-6 h-6 text-red-400 shrink-0" />
          <div><p className="text-2xl font-black text-red-400">{sales.filter(s => s.status === 'CANCELLED').length}</p><p className="text-[10px] font-black text-engraved uppercase tracking-widest">Canceladas</p></div>
        </div>
        <div className="glass-bevel px-5 py-4 flex items-center gap-4">
          <FileText className="w-6 h-6 text-cyan-400 shrink-0" />
          <div><p className="text-2xl font-black text-cyan-400">{fmtUSD(totalVentas)}</p><p className="text-[10px] font-black text-engraved uppercase tracking-widest">Ingresos USD</p></div>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-bevel overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 font-bold animate-pulse">Cargando historial...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 glass-icon">
                  {['FACTURA', 'FECHA', 'ITEMS', 'METODO', 'MONEDA', 'SUBTOTAL', 'IVA', 'TOTAL USD', 'TOTAL Bs.', 'STATUS', 'ACCION'].map(h => (
                    <th key={h} className="px-4 py-4 text-left text-[10px] font-black text-engraved tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={"border-b border-white/5 hover:bg-white/[0.03] transition-colors " + (i % 2 === 0 ? '' : 'bg-black/10')}>
                    <td className="px-4 py-3 text-xs font-black text-emerald-400 tracking-widest whitespace-nowrap">{s.invoiceNumber}</td>
                    <td className="px-4 py-3 text-xs font-bold text-zinc-300 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-zinc-400 whitespace-nowrap">{s.items?.length || 0} item(s)</td>
                    <td className="px-4 py-3 text-xs font-bold whitespace-nowrap">
                      <span className="text-blue-400">{{CASH:'EFECTIVO', CARD:'TARJETA', TRANSFER:'TRANSF.'}[s.paymentMethod as string] || s.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-zinc-300 whitespace-nowrap">{s.paymentCurrency}</td>
                    <td className="px-4 py-3 text-xs font-bold text-zinc-300 whitespace-nowrap">{fmtUSD(Number(s.subtotalUSD))}</td>
                    <td className="px-4 py-3 text-xs font-bold text-blue-400 whitespace-nowrap">{fmtUSD(Number(s.taxUSD))}</td>
                    <td className="px-4 py-3 text-sm font-black text-white whitespace-nowrap">{fmtUSD(Number(s.totalUSD))}</td>
                    <td className="px-4 py-3 text-sm font-black text-cyan-400 whitespace-nowrap">Bs. {fmtVES(Number(s.totalVES))}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={"text-[10px] font-black px-2 py-1 rounded-full " + (s.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                        {s.status === 'COMPLETED' ? 'COMPLETADA' : 'CANCELADA'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(s)}
                        className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-colors" title="Ver factura">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="px-5 py-16 text-center text-engraved font-bold text-sm">No se encontraron ventas</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Detalle de Factura */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-base font-black text-white tracking-widest">VENTECH ERP</span>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="text-center border-b border-dashed border-zinc-600 pb-4">
              <p className="text-xs text-zinc-400">FACTURA DE VENTA</p>
              <p className="text-xl font-black text-emerald-400">{selected.invoiceNumber}</p>
              <p className="text-xs text-zinc-400">{new Date(selected.createdAt).toLocaleString('es-VE')}</p>
            </div>
            <div className="space-y-1.5 border-b border-dashed border-zinc-600 pb-4">
              {selected.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 font-bold truncate">{item.name}</p>
                    <p className="text-zinc-500">{Number(item.quantity).toFixed(3)} {item.unit} x {fmtUSD(Number(item.priceUSD))}</p>
                  </div>
                  <span className="text-zinc-200 font-bold ml-2 whitespace-nowrap">{fmtUSD(Number(item.subtotal))}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs border-b border-dashed border-zinc-600 pb-4">
              <div className="flex justify-between text-zinc-400"><span>BASE IMPONIBLE</span><span>{fmtUSD(Number(selected.subtotalUSD))}</span></div>
              <div className="flex justify-between text-blue-400"><span>IVA (16%)</span><span>{fmtUSD(Number(selected.taxUSD))}</span></div>
              {Number(selected.igtfUSD) > 0 && <div className="flex justify-between text-amber-400"><span>IGTF (3%)</span><span>{fmtUSD(Number(selected.igtfUSD))}</span></div>}
              <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-zinc-600">
                <span>TOTAL USD</span><span>{fmtUSD(Number(selected.totalUSD))}</span>
              </div>
              <div className="flex justify-between text-cyan-400"><span>TOTAL Bs. (Tasa: {fmtVES(Number(selected.exchangeRate))})</span><span>Bs. {fmtVES(Number(selected.totalVES))}</span></div>
            </div>
            <div className="text-xs flex justify-between text-zinc-400">
              <span>PAGO</span>
              <span className="text-zinc-200 font-bold">{{CASH:'EFECTIVO', CARD:'TARJETA', TRANSFER:'PAGO MOVIL'}[selected.paymentMethod as string] || selected.paymentMethod} — {selected.paymentCurrency}</span>
            </div>
            <div className="text-center text-[10px] text-zinc-600 border-t border-dashed border-zinc-600 pt-3">
              <p>SUJETO AL IVA - RIF: J-00000000-0</p>
              <p>Conforme a la Ley del IVA y normativa SENIAT</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => window.print()} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-blue-700 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> IMPRIMIR
              </button>
              {selected.status === 'COMPLETED' && (
                <button
                  onClick={() => requireAdminAuth(executeVoidSale)}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-red-700 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> ANULAR VENTA
                </button>
              )}
              <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl text-sm font-black text-zinc-300 bg-zinc-800 border border-zinc-700">CERRAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Auth Required */}
      {authModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-bevel rounded-2xl w-full max-w-sm border border-red-500/20 shadow-2xl shadow-red-900/20">
            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-red-500/5 rounded-t-2xl">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h2 className="text-base font-black text-engraved-light uppercase tracking-widest text-red-100">Autorización Requerida</h2>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-zinc-400">Esta acción requiere privilegios de Administrador. Ingresa las credenciales autorizadas para continuar.</p>
              {authError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400">{authError}</div>}
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5">Cédula (Administrador)</label>
                  <div className="flex">
                    <span className="flex items-center justify-center bg-black/60 border border-white/10 border-r-0 rounded-l-xl px-4 text-zinc-400 font-bold text-sm">V-</span>
                    <input className="w-full glass-icon rounded-r-xl rounded-l-none px-4 py-3 pl-3 text-sm text-zinc-200 font-bold placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" type="text" placeholder="22222222" value={authUsername.replace('V-', '')} onChange={e => setAuthUsername('V-' + e.target.value.replace(/\D/g, ''))} autoFocus required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input className="w-full glass-icon rounded-xl px-4 py-3 pr-10 text-sm text-zinc-200 font-bold placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" type={showAuthPassword ? 'text' : 'password'} placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-3 text-zinc-500 hover:text-white">
                      {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> AUTORIZAR
                  </button>
                  <button type="button" onClick={() => setAuthModal(false)} className="px-5 py-3 glass-icon rounded-xl text-zinc-400 hover:text-white transition-colors font-bold">CANCELAR</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
