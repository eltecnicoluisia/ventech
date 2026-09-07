'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  Settings, Save, AlertCircle, ArrowLeft, Building, Percent, Globe,
  DollarSign, Bell, Printer, FileText, RefreshCw, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, settings, updateSettings, isLoaded } = useAuth();
  const router = useRouter();

  const [chargeIVA, setChargeIVA] = useState(settings.chargeIVA);
  const [chargeIGTF, setChargeIGTF] = useState(settings.chargeIGTF);
  const [saved, setSaved] = useState(false);

  const [company, setCompany] = useState({
    name: 'Mi Empresa',
    rif: 'J-00000000-0',
    address: '',
    phone: '',
    email: '',
    currency: 'USD',
    invoicePrefix: 'FAC',
  });

  const [licenseDate, setLicenseDate] = useState('');

  useEffect(() => {
    setChargeIVA(settings.chargeIVA);
    setChargeIGTF(settings.chargeIGTF);
    setCompany({
      name: localStorage.getItem('ventech_company_name') || 'Mi Empresa',
      rif: localStorage.getItem('ventech_company_rif') || 'J-00000000-0',
      address: localStorage.getItem('ventech_company_address') || '',
      phone: localStorage.getItem('ventech_company_phone') || '',
      email: localStorage.getItem('ventech_company_email') || '',
      currency: localStorage.getItem('ventech_company_currency') || 'USD',
      invoicePrefix: localStorage.getItem('ventech_invoice_prefix') || 'FAC',
    });
    const d = localStorage.getItem('ventech_license_date');
    setLicenseDate(d ? d.split('T')[0] : '');
  }, [settings]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-bevel p-12 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-zinc-400 mb-6">Solo los administradores pueden acceder a la configuración.</p>
          <Link href="/" className="px-6 py-2 bg-blue-600 rounded-xl text-white font-medium">Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateSettings({ chargeIVA, chargeIGTF });
    localStorage.setItem('ventech_company_name', company.name);
    localStorage.setItem('ventech_company_rif', company.rif);
    localStorage.setItem('ventech_company_address', company.address);
    localStorage.setItem('ventech_company_phone', company.phone);
    localStorage.setItem('ventech_company_email', company.email);
    localStorage.setItem('ventech_company_currency', company.currency);
    localStorage.setItem('ventech_invoice_prefix', company.invoicePrefix);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1.5";

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <label className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group">
      <div className="flex-1 mr-4">
        <div className="font-medium text-white mb-1">{label}</div>
        <div className="text-sm text-zinc-400">{desc}</div>
      </div>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
      </div>
    </label>
  );

  return (
    <div className="min-h-screen text-zinc-200">
      {/* Header */}
      <div className="sticky top-0 z-40 p-4 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-9 h-9 glass-icon rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Configuración del Sistema</h1>
              <p className="text-xs text-zinc-500">Ajustes generales, fiscales y de la empresa</p>
            </div>
          </div>
          <button onClick={handleSave} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${saved ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar Cambios</>}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* License Settings - SOLO SUPERADMIN */}
        {user.role === 'SUPERADMIN' && (
          <div className="glass-bevel rounded-2xl p-6 border-red-500/20 shadow-lg shadow-red-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-red-500/10 rounded-bl-2xl">
              <span className="text-[10px] font-black text-red-500 tracking-widest">ZONA SUPERADMIN</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-bold text-red-100">Control de Licencia (Bomba de Tiempo)</h2>
                <p className="text-xs text-red-400">Protege tu software definiendo una fecha límite de uso</p>
              </div>
            </div>

            {/* Estado actual */}
            <div className={`p-4 rounded-xl mb-5 text-sm border ${licenseDate ? 'bg-amber-500/10 border-amber-500/20 text-amber-200/80' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200/80'}`}>
              <p className="font-semibold mb-1">
                {licenseDate
                  ? `⏳ Vence el: ${new Date(licenseDate + 'T12:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}`
                  : '✅ Licencia Perpetua — Sin Fecha de Vencimiento'}
              </p>
              <p>Al llegar a la fecha configurada, el sistema se bloqueará mostrando &quot;Licencia Expirada&quot;. Vacío = ilimitado.</p>
            </div>

            {/* Botones de extensión rápida */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-red-300 mb-3 uppercase tracking-wider">Extender Rápidamente (suma desde la fecha actual)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: '+1 Mes', months: 1, cls: 'bg-blue-900/40 border-blue-700 text-blue-200 hover:bg-blue-800/60' },
                  { label: '+3 Meses', months: 3, cls: 'bg-blue-900/40 border-blue-700 text-blue-200 hover:bg-blue-800/60' },
                  { label: '+6 Meses', months: 6, cls: 'bg-violet-900/40 border-violet-700 text-violet-200 hover:bg-violet-800/60' },
                  { label: '+1 Año', months: 12, cls: 'bg-violet-900/40 border-violet-700 text-violet-200 hover:bg-violet-800/60' },
                  { label: '+2 Años', months: 24, cls: 'bg-amber-900/40 border-amber-700 text-amber-200 hover:bg-amber-800/60' },
                  { label: '+5 Años', months: 60, cls: 'bg-amber-900/40 border-amber-700 text-amber-200 hover:bg-amber-800/60' },
                  { label: '+10 Años', months: 120, cls: 'bg-emerald-900/40 border-emerald-700 text-emerald-200 hover:bg-emerald-800/60' },
                  { label: '♾ Indefinida', months: -1, cls: 'bg-emerald-900/40 border-emerald-700 text-emerald-200 hover:bg-emerald-800/60' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={async () => {
                      let dateObj: string | null = null;
                      let newDate = '';
                      if (preset.months === -1) {
                        localStorage.removeItem('ventech_license_date');
                      } else {
                        const base = licenseDate ? new Date(licenseDate + 'T12:00:00') : new Date();
                        base.setMonth(base.getMonth() + preset.months);
                        dateObj = base.toISOString();
                        newDate = base.toISOString().split('T')[0];
                        localStorage.setItem('ventech_license_date', dateObj);
                      }
                      setLicenseDate(newDate);
                      await fetch('/api/license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ expiresAt: dateObj })
                      });
                      setSaved(true);
                      setTimeout(() => setSaved(false), 3000);
                    }}
                    className={`px-3 py-2.5 rounded-xl border font-bold text-sm transition-colors ${preset.cls}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha exacta manual */}
            <div>
              <label className={labelClass + ' text-red-300'}>O Establece una Fecha Exacta de Vencimiento</label>
              <div className="flex gap-3">
                <input 
                  type="date" 
                  className={inputClass + ' border-red-500/30 focus:border-red-500'} 
                  value={licenseDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={async (e) => {
                    const date = e.target.value;
                    setLicenseDate(date);
                    const dateObj = date ? new Date(date + 'T23:59:59Z').toISOString() : null;
                    if (date) {
                      localStorage.setItem('ventech_license_date', dateObj || '');
                    } else {
                      localStorage.removeItem('ventech_license_date');
                    }
                    await fetch('/api/license', { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ expiresAt: dateObj })
                    });
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                  }}
                />
                <button 
                  onClick={async () => {
                    setLicenseDate('');
                    localStorage.removeItem('ventech_license_date');
                    await fetch('/api/license', { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ expiresAt: null })
                    });
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                  }}
                  className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-100 font-bold rounded-xl border border-red-700 transition-colors whitespace-nowrap"
                >
                  ✕ Quitar Vencimiento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Info */}
        <div className="glass-bevel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Building className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Información de la Empresa</h2>
              <p className="text-xs text-zinc-400">Datos que aparecerán en las facturas y tickets</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre Comercial</label>
              <input className={inputClass} placeholder="Mi Tienda S.A." value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>RIF de la Empresa</label>
              <input className={inputClass} placeholder="J-12345678-9" value={company.rif} onChange={e => setCompany({...company, rif: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Dirección Fiscal</label>
              <input className={inputClass} placeholder="Av. Principal, Local 5, Ciudad, Estado" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Teléfono de Contacto</label>
              <input className={inputClass} placeholder="0412-1234567" value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Correo de Contacto</label>
              <input className={inputClass} type="email" placeholder="info@miempresa.com" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Fiscal Settings */}
        <div className="glass-bevel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
              <Percent className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Configuración Fiscal</h2>
              <p className="text-xs text-zinc-400">Adaptado para pequeños comercios, bodegas y kioscos venezolanos</p>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/80">
              <p className="font-semibold mb-1">Ley del IVA Venezuela (LISLR)</p>
              <p>Los pequeños contribuyentes no sujetos al IVA pueden desactivar su cobro. El IGTF (3%) aplica únicamente a pagos en divisas en efectivo según el Decreto 4.446.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Toggle
              checked={chargeIVA}
              onChange={setChargeIVA}
              label="Cobrar IVA (16%) en ventas"
              desc="El IVA se sumará automáticamente al subtotal en cada venta. Desactívalo si eres contribuyente exento o pequeño comerciante."
            />
            <Toggle
              checked={chargeIGTF}
              onChange={setChargeIGTF}
              label="Cobrar IGTF (3%) en divisas efectivo"
              desc="El IGTF aplica cuando el cliente paga en USD, EUR u otra divisa en efectivo. Según el Decreto 4.446 del BCV."
            />
          </div>

          {(!chargeIVA || !chargeIGTF) && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-200/80">
                {!chargeIVA && !chargeIGTF && 'El sistema operará sin cobro de IVA ni IGTF. Los precios serán directos sin impuestos adicionales.'}
                {!chargeIVA && chargeIGTF && 'El sistema operará sin cobro de IVA. Solo se cobrará IGTF al pagar en divisas efectivo.'}
                {chargeIVA && !chargeIGTF && 'El sistema cobrará IVA normalmente pero no aplicará IGTF, incluso al pagar en divisas.'}
              </p>
            </div>
          )}
        </div>

        {/* Invoice Settings */}
        <div className="glass-bevel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Configuración de Facturas</h2>
              <p className="text-xs text-zinc-400">Personaliza el formato de tus facturas y tickets</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prefijo de Factura</label>
              <input className={inputClass} placeholder="FAC" maxLength={5} value={company.invoicePrefix} onChange={e => setCompany({...company, invoicePrefix: e.target.value.toUpperCase()})} />
              <p className="text-xs text-zinc-500 mt-1">Ej: FAC-000001, VT-000001</p>
            </div>
            <div>
              <label className={labelClass}>Moneda Principal</label>
              <select className={inputClass} value={company.currency} onChange={e => setCompany({...company, currency: e.target.value})}>
                <option value="USD">USD - Dólar Americano</option>
                <option value="VES">VES - Bolívar Venezolano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
