'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BarChart3, TrendingUp, DollarSign, Package, 
  CreditCard, Wallet, Users, AlertCircle, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

function fmtUSD(n: number): string {
  const [intPart, decPart] = n.toFixed(2).split('.');
  return '$' + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        setError('Error al cargar datos');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user || !['SUPERADMIN', 'ADMIN', 'MANAGER', 'AUDITOR'].includes(user.role)) {
    return <div className="p-8 text-white">Acceso denegado.</div>;
  }

  // Cálculos básicos
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.status === 'COMPLETED' && s.createdAt.startsWith(today));
  const monthSales = sales.filter(s => s.status === 'COMPLETED' && s.createdAt.startsWith(today.slice(0, 7)));

  const totalVentasHoy = todaySales.reduce((acc, s) => acc + Number(s.subtotalUSD), 0);
  const totalVentasMes = monthSales.reduce((acc, s) => acc + Number(s.subtotalUSD), 0);
  
  let productosVendidosHoy = 0;
  todaySales.forEach(s => {
    if (s.items) {
      s.items.forEach((i: any) => productosVendidosHoy += Number(i.quantity));
    }
  });

  const gananciaEstimada = totalVentasMes * 0.3; // Asumiendo margen promedio del 30%

  // Métodos de pago
  const totalsByMethod = { CASH: 0, CARD: 0, TRANSFER: 0 };
  monthSales.forEach(s => {
    if (s.paymentMethod === 'CASH') totalsByMethod.CASH += Number(s.totalUSD);
    if (s.paymentMethod === 'CARD') totalsByMethod.CARD += Number(s.totalUSD);
    if (s.paymentMethod === 'TRANSFER') totalsByMethod.TRANSFER += Number(s.totalUSD);
  });

  // Top Productos
  const productCount: Record<string, { name: string, qty: number, revenue: number }> = {};
  monthSales.forEach(s => {
    s.items?.forEach((i: any) => {
      if (!productCount[i.name]) productCount[i.name] = { name: i.name, qty: 0, revenue: 0 };
      productCount[i.name].qty += Number(i.quantity);
      productCount[i.name].revenue += Number(i.subtotal);
    });
  });
  const topProducts = Object.values(productCount).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Chart data (últimos 7 días)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const daySales = sales.filter(s => s.status === 'COMPLETED' && s.createdAt.startsWith(date));
    return {
      date: date.slice(8, 10) + '/' + date.slice(5, 7),
      total: daySales.reduce((acc, s) => acc + Number(s.subtotalUSD), 0)
    };
  });
  const maxChartVal = Math.max(...chartData.map(d => d.total), 1);

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
                <BarChart3 className="w-6 h-6 text-amber-400" /> Analítica y Dashboard
              </h1>
              <p className="text-sm text-zinc-400">Rendimiento del negocio en tiempo real</p>
            </div>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 glass-icon rounded-xl text-sm font-semibold hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {error && <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-bevel p-5 rounded-2xl border-t-2 border-emerald-400">
            <p className="text-xs font-semibold text-zinc-400 mb-1">Ventas Hoy</p>
            <p className="text-3xl font-black text-white">{fmtUSD(totalVentasHoy)}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400"><TrendingUp className="w-3 h-3" /> En tiempo real</div>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-t-2 border-blue-400">
            <p className="text-xs font-semibold text-zinc-400 mb-1">Ventas del Mes</p>
            <p className="text-3xl font-black text-white">{fmtUSD(totalVentasMes)}</p>
            <p className="mt-2 text-xs text-zinc-500">Acumulado mensual</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-t-2 border-violet-400">
            <p className="text-xs font-semibold text-zinc-400 mb-1">Productos Vendidos Hoy</p>
            <p className="text-3xl font-black text-white">{productosVendidosHoy.toFixed(0)}</p>
            <p className="mt-2 text-xs text-zinc-500">Unidades totales</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-t-2 border-amber-400">
            <p className="text-xs font-semibold text-zinc-400 mb-1">Ganancia Bruta Mes (Est.)</p>
            <p className="text-3xl font-black text-amber-400">{fmtUSD(gananciaEstimada)}</p>
            <p className="mt-2 text-xs text-zinc-500">~30% margen global</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 glass-bevel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-6">Ventas Últimos 7 Días</h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div className="opacity-0 group-hover:opacity-100 text-xs font-bold text-white mb-2 transition-opacity">
                    {fmtUSD(d.total)}
                  </div>
                  <div 
                    className="w-full bg-blue-500/50 hover:bg-blue-400 rounded-t-md transition-all relative"
                    style={{ height: `${Math.max((d.total / maxChartVal) * 100, 5)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-t-md"></div>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2 font-semibold">{d.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="glass-bevel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-6">Métodos de Pago (Mes)</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400"><DollarSign className="w-5 h-5" /></div>
                  <span className="font-semibold text-white">Efectivo</span>
                </div>
                <span className="font-bold text-emerald-400">{fmtUSD(totalsByMethod.CASH)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400"><CreditCard className="w-5 h-5" /></div>
                  <span className="font-semibold text-white">Tarjeta (POS)</span>
                </div>
                <span className="font-bold text-blue-400">{fmtUSD(totalsByMethod.CARD)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400"><Wallet className="w-5 h-5" /></div>
                  <span className="font-semibold text-white">Transferencia</span>
                </div>
                <span className="font-bold text-violet-400">{fmtUSD(totalsByMethod.TRANSFER)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-bevel p-6 rounded-2xl overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4">Top 5 Productos (Mes)</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs text-zinc-500">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Vendidos</th>
                  <th className="pb-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-5 text-zinc-500 text-xs">{i+1}.</span> {p.name}
                    </td>
                    <td className="py-3 text-right text-zinc-400">{p.qty.toFixed(0)}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">{fmtUSD(p.revenue)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-zinc-500">No hay datos</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="glass-bevel p-6 rounded-2xl overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4">Últimas Ventas</h2>
            <div className="space-y-3">
              {sales.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                  <div>
                    <p className="font-bold text-white text-sm">{s.invoiceNumber}</p>
                    <p className="text-xs text-zinc-500">{new Date(s.createdAt).toLocaleString('es-VE')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cyan-400">{fmtUSD(Number(s.totalUSD))}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{s.paymentMethod}</p>
                  </div>
                </div>
              ))}
              {sales.length === 0 && <div className="py-8 text-center text-zinc-500">No hay ventas registradas</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
