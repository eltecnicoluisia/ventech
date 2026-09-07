const fs = require('fs');
const path = require('path');

const exchangePage = `'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus,
  Globe, Clock, AlertTriangle, CheckCircle, Wifi, WifiOff, Activity
} from 'lucide-react';

interface BcvRate {
  source: string;
  usd: number;
  eur: number;
  cop: number;
  brl: number;
  fetchedAt: string;
  isStale: boolean;
}

interface HistoryPoint {
  rate: number;
  createdAt: string;
}

const API = '/api/exchange';

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const color = last > prev ? '#34d399' : last < prev ? '#f87171' : '#a1a1aa';
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExchangePage() {
  const [rate, setRate] = useState<BcvRate | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(300);
  const [error, setError] = useState(false);

  const fetchRate = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [rateRes, histRes] = await Promise.all([
        fetch(API + '/bcv').then(r => r.json()),
        fetch(API + '/history?limit=24').then(r => r.json()),
      ]);
      setRate(rateRes);
      if (Array.isArray(histRes)) setHistory(histRes);
      setLastUpdate(new Date());
      setCountdown(300);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 5 minutes
  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sparkData = history.map(h => h.rate).filter(Boolean);
  const prevRate = sparkData.length >= 2 ? sparkData[sparkData.length - 2] : null;
  const trend = rate && prevRate ? (rate.usd > prevRate ? 'up' : rate.usd < prevRate ? 'down' : 'flat') : 'flat';
  const change = rate && prevRate ? ((rate.usd - prevRate) / prevRate * 100).toFixed(3) : '0.000';

  const fmt = (n: number) => n > 0 ? 'Bs. ' + n.toFixed(2) : 'N/D';
  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="min-h-screen text-zinc-200 p-4">
      {/* Header */}
      <div className="glass-bevel px-6 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/" className="glass-icon p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-cyan-400 drop-shadow-md" />
          <div>
            <h1 className="font-black text-engraved-light uppercase tracking-widest text-lg">Monitor de Tasa BCV</h1>
            <p className="text-xs font-bold text-engraved tracking-wide">Banco Central de Venezuela — Tasa Oficial en Tiempo Real</p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          {/* Countdown */}
          <div className="glass-bevel px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-engraved-light">Actualiza en</span>
            <span className="font-black text-cyan-400">{mins}:{secs.toString().padStart(2, '0')}</span>
          </div>
          <button
            onClick={fetchRate}
            disabled={loading}
            className="glass-bevel px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black text-engraved-light hover:text-cyan-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={"w-4 h-4 " + (loading ? 'animate-spin' : '')} />
            ACTUALIZAR
          </button>
        </div>
      </div>

      {/* Error / Status banner */}
      {(error || rate?.isStale) && (
        <div className="glass-bevel border border-amber-500/20 px-5 py-3 mb-6 flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">
            {error
              ? 'No se pudo conectar con la API del BCV. Verifica la conexión del servidor.'
              : 'Datos con más de 5 minutos de antigüedad. Reconectando...'}
          </p>
        </div>
      )}

      {/* Main Rate Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* USD (Main) */}
        <div className="lg:col-span-2 glass-bevel p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-engraved tracking-widest uppercase mb-2">Dólar Estadounidense — Tasa Oficial BCV</p>
              {loading ? (
                <div className="h-20 w-48 glass-icon rounded-2xl animate-pulse" />
              ) : (
                <div className="flex items-end gap-4">
                  <h2 className="text-6xl font-black text-engraved-light tracking-tighter">
                    {rate?.usd ? 'Bs. ' + rate.usd.toFixed(2) : 'N/D'}
                  </h2>
                  <div className={"flex items-center gap-1 pb-2 text-lg font-black " + (trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-zinc-500')}>
                    {trend === 'up' ? <TrendingUp className="w-6 h-6" /> : trend === 'down' ? <TrendingDown className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                    {change !== '0.000' && (trend === 'up' ? '+' : '-')}{Math.abs(Number(change)).toFixed(3)}%
                  </div>
                </div>
              )}
              <p className="text-xs font-bold text-engraved mt-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Fuente: Banco Central de Venezuela (BCV)
                {lastUpdate && ' • Actualizado: ' + lastUpdate.toLocaleTimeString('es-VE')}
              </p>
            </div>
            <div className="glass-icon rounded-2xl p-4 text-cyan-400">
              <Activity className="w-8 h-8 drop-shadow-md" />
            </div>
          </div>
          {/* Sparkline */}
          {sparkData.length > 1 && (
            <div className="glass-icon rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-engraved tracking-widest uppercase mb-1">Histórico Reciente</p>
                <p className="text-xs font-bold text-engraved-light">{sparkData.length} registros</p>
              </div>
              <Sparkline data={sparkData} />
              <div className="text-right">
                <p className="text-[9px] font-black text-engraved tracking-widest uppercase mb-1">Rango</p>
                <p className="text-xs font-black text-zinc-300">{Math.min(...sparkData).toFixed(2)} – {Math.max(...sparkData).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Other Currencies */}
        <div className="flex flex-col gap-4">
          {[
            { code: 'EUR', label: 'Euro', flag: '🇪🇺', value: rate?.eur },
            { code: 'COP', label: 'Peso Colombiano', flag: '🇨🇴', value: rate?.cop },
            { code: 'BRL', label: 'Real Brasileño', flag: '🇧🇷', value: rate?.brl },
          ].map(c => (
            <div key={c.code} className="glass-bevel p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <p className="text-[9px] font-black text-engraved tracking-widest uppercase">{c.label}</p>
                  <p className="text-xs font-bold text-zinc-400">{c.code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-engraved-light">
                  {loading ? '...' : c.value ? 'Bs. ' + c.value.toFixed(4) : 'N/D'}
                </p>
                <p className="text-[9px] font-bold text-engraved">por 1 {c.code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IGTF Calculator */}
      <div className="glass-bevel p-6 mb-6">
        <p className="text-[10px] font-black text-engraved tracking-widest uppercase mb-5">Calculadora IGTF (3% — Pagos en Divisas)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[10, 50, 100, 500].map(usd => {
            const bs = rate?.usd ? usd * rate.usd : 0;
            const igtf = usd * 0.03;
            const total = usd + igtf;
            return (
              <div key={usd} className="glass-icon rounded-xl p-4 text-center">
                <p className="text-[9px] font-black text-engraved tracking-widest uppercase mb-2">$ {usd} USD</p>
                <p className="text-lg font-black text-blue-400 mb-1">\${total.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-amber-400">+IGTF \${igtf.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-engraved mt-2">= Bs. {bs ? (total * rate!.usd).toFixed(2) : 'N/D'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div className="glass-bevel overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 glass-icon">
            <p className="text-[10px] font-black text-engraved tracking-widest uppercase">Historial de Consultas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['FECHA Y HORA', 'TASA USD/VES', 'VARIACIÓN', 'FUENTE'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-engraved tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map((h, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? h.rate - prev.rate : 0;
                  return (
                    <tr key={i} className={"border-b border-white/5 hover:bg-white/[0.02] " + (i % 2 === 0 ? '' : 'bg-black/10')}>
                      <td className="px-5 py-3 text-xs font-bold text-engraved-light">{new Date(h.createdAt).toLocaleString('es-VE')}</td>
                      <td className="px-5 py-3 text-sm font-black text-cyan-400">Bs. {h.rate.toFixed(2)}</td>
                      <td className={"px-5 py-3 text-xs font-bold " + (diff > 0 ? 'text-red-400' : diff < 0 ? 'text-emerald-400' : 'text-zinc-500')}>
                        {diff !== 0 ? (diff > 0 ? '+' : '') + diff.toFixed(2) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-engraved">BCV Oficial</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const dir = path.join(__dirname, 'apps/web/app/exchange');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'page.tsx'), exchangePage, 'utf8');
console.log('Exchange page generated OK');
