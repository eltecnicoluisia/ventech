'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, Search, Plus, Edit2, Trash2, X, Phone, Mail, FileText, CreditCard, DollarSign
} from 'lucide-react';
import Link from 'next/link';

function fmtUSD(n: number): string {
  const [intPart, decPart] = n.toFixed(2).split('.');
  return '$' + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null); // 'create', 'edit'
  const [selected, setSelected] = useState<any>(null);
  
  const [form, setForm] = useState({ name: '', documentId: '', phone: '', email: '', creditLimit: '0' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/customers');
      if (res.ok) setCustomers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (!user || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
    return <div className="p-8 text-white">Acceso denegado.</div>;
  }

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.documentId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredit = customers.reduce((acc, c) => acc + (Number(c.creditLimit) || 0), 0);
  const withCredit = customers.filter(c => Number(c.creditLimit) > 0).length;

  const handleSave = async () => {
    if (!form.name) return alert('Nombre es requerido');
    try {
      const url = modal === 'create' ? '/api/inventory/customers' : `/api/inventory/customers/${selected.id}`;
      const method = modal === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModal(null);
        loadData();
      }
    } catch (e) {
      alert('Error guardando cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
      await fetch(`/api/inventory/customers/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const openEdit = (c: any) => {
    setSelected(c);
    setForm({ name: c.name, documentId: c.documentId||'', phone: c.phone||'', email: c.email||'', creditLimit: c.creditLimit||'0' });
    setModal('edit');
  };

  const openCreate = () => {
    setForm({ name: '', documentId: '', phone: '', email: '', creditLimit: '0' });
    setModal('create');
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1.5";

  return (
    <div className="min-h-screen text-zinc-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between glass-bevel p-4 rounded-2xl gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link href="/" className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-violet-400" /> Clientes y CRM
              </h1>
              <p className="text-sm text-zinc-400">{customers.length} clientes registrados</p>
            </div>
          </div>
          <button onClick={openCreate} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-violet-400">
            <p className="text-xs font-semibold text-zinc-400">Total Clientes</p>
            <p className="text-3xl font-black text-white">{customers.length}</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-blue-400">
            <p className="text-xs font-semibold text-zinc-400">Líneas de Crédito Activas</p>
            <p className="text-3xl font-black text-white">{withCredit}</p>
          </div>
          <div className="glass-bevel p-5 rounded-2xl border-l-4 border-emerald-400">
            <p className="text-xs font-semibold text-zinc-400">Crédito Global Aprobado</p>
            <p className="text-3xl font-black text-emerald-400">{fmtUSD(totalCredit)}</p>
          </div>
        </div>

        {/* Search & Table */}
        <div className="glass-bevel rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex gap-4 items-center bg-black/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o RIF/Cédula..." 
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 border-b border-white/10">
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Documento</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Límite Crédito</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{c.name}</td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{c.documentId || 'N/D'}</td>
                    <td className="px-6 py-4 text-zinc-400">
                      {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3"/> {c.phone}</div>}
                      {c.email && <div className="flex items-center gap-1 mt-1"><Mail className="w-3 h-3"/> {c.email}</div>}
                      {!c.phone && !c.email && 'N/D'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {Number(c.creditLimit) > 0 ? fmtUSD(Number(c.creditLimit)) : <span className="text-zinc-600 text-xs font-normal">Sin crédito</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="w-8 h-8 glass-icon rounded-lg flex items-center justify-center text-zinc-400 hover:text-blue-400"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(c.id)} className="w-8 h-8 glass-icon rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-zinc-500">No se encontraron clientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" /> 
                {modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h2>
              <button onClick={() => setModal(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={labelClass}>Nombre / Razón Social *</label><input className={inputClass} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Juan Pérez" /></div>
              <div><label className={labelClass}>RIF / Cédula</label><input className={inputClass} value={form.documentId} onChange={e=>setForm({...form,documentId:e.target.value})} placeholder="V-12345678" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Teléfono</label><input className={inputClass} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0412-1234567" /></div>
                <div><label className={labelClass}>Correo</label><input className={inputClass} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="juan@correo.com" /></div>
              </div>
              <div>
                <label className={labelClass}>Límite de Crédito Aprobado (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input className={inputClass + " pl-9 font-mono"} type="number" step="0.01" min="0" value={form.creditLimit} onChange={e=>setForm({...form,creditLimit:e.target.value})} />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Coloca 0 si el cliente no posee crédito en la tienda.</p>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={handleSave} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20">Guardar</button>
              <button onClick={() => setModal(null)} className="flex-1 py-3 glass-icon text-zinc-300 rounded-xl font-bold hover:text-white transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
