'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/UserContext';
import {
  ArrowLeft, Plus, Search, Eye, EyeOff, Pencil, Trash2, Package,
  Tag, Layers, Hash, BarChart3, AlertTriangle, CheckCircle,
  Filter, Download, Upload, X, Save, ChevronDown, ShieldAlert, Lock
} from 'lucide-react';

type ProductStatus = 'ACTIVO' | 'AGOTADO' | 'SUSPENDIDO';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  type: string;
  unit: string;
  stock: number;
  minStock: number;
  costUSD: number;
  priceUSD: number;
  status: ProductStatus;
  description: string;
  brand: string;
  model: string;
  location: string;
  imei?: string;
  serialNo?: string;
  attributes?: any;
}

const UNITS = ['Unidad', 'Caja', 'Par', 'Docena', 'Litro', 'Kg', 'Metro'];

const STATUS_STYLES: Record<ProductStatus, string> = {
  ACTIVO: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  AGOTADO: 'text-red-400 bg-red-500/10 border border-red-500/20',
  SUSPENDIDO: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
};

const EMPTY: Product = {
  id: '', code: '', name: '', category: '', type: '',
  unit: 'Unidad', stock: 0, minStock: 5, costUSD: 0, priceUSD: 0,
  status: 'ACTIVO', description: '', brand: '', model: '', location: ''
};

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<{id:string;name:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState<null | 'view' | 'edit' | 'create' | 'delete' | 'manage-cats' | 'manage-types'>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>(EMPTY);
  const [newCatName, setNewCatName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');

  const [authModal, setAuthModal] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryAttributes, setEditingCategoryAttributes] = useState<string[]>([]);
  
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, tRes] = await Promise.all([
        fetch('/api/inventory/products', { cache: 'no-store' }),
        fetch('/api/inventory/categories', { cache: 'no-store' }),
        fetch('/api/inventory/types', { cache: 'no-store' }),
      ]);
      const [pData, cData, tData] = await Promise.all([pRes.json(), cRes.json(), tRes.json()]);
      if (Array.isArray(pData)) {
        setProducts(pData.map((p: any) => ({
          ...p,
          priceUSD: Number(p.priceUSD || 0),
          costUSD: Number(p.costUSD || 0)
        })));
      }
      if (Array.isArray(cData)) setCategories(cData); else console.error('cData is not an array:', cData);
      if (Array.isArray(tData)) setTypes(tData); else console.error('tData is not an array:', tData);
    } catch (err: any) {
      console.error('Fetch error:', err);
      alert('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? p.category === filterCat : true;
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchCat && matchStatus;
  });

  const totalItems = products.length;
  const totalValue = products.reduce((s, p) => s + p.stock * Number(p.priceUSD), 0);
  const lowStock = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  function openView(p: Product) { setSelected(p); setModal('view'); }
  function openEdit(p: Product) { setForm({ ...p, priceUSD: Number(p.priceUSD), costUSD: Number(p.costUSD) }); setModal('edit'); }
  function openCreate() { setForm({ ...EMPTY, category: categories[0]?.name || '', type: types[0]?.name || '' }); setModal('create'); }
  function openDelete(p: Product) { setSelected(p); setModal('delete'); }
  function closeModal() { setModal(null); setSelected(null); }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (modal === 'create') {
        const { id, ...data } = form;
        const res = await fetch('/api/inventory/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) { const e = await res.json(); console.error(e); showToast('Error: ' + (e.message || 'No se pudo crear'), 'error'); setIsSaving(false); return; }
        showToast('Producto creado con éxito', 'success');
      } else if (modal === 'edit') {
        const res = await fetch(`/api/inventory/products/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const e = await res.json(); console.error(e); showToast('Error: ' + (e.message || 'No se pudo guardar'), 'error'); setIsSaving(false); return; }
        showToast('Producto guardado con éxito', 'success');
      }
      await fetchAll();
      closeModal();
    } catch (err) { console.error(err); showToast('Error de conexión', 'error'); }
    setIsSaving(false);
  }

  const requireAdminAuth = (action: () => Promise<void>) => {
    if (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') {
      action();
    } else {
      setPendingAction(() => action);
      setAuthModal(true);
      setAuthError('');
      setAuthUsername('');
      setAuthPassword('');
    }
  };

  async function executeDelete() {
    if (selected) {
      try {
        const res = await fetch(`/api/inventory/products/${selected.id}`, { method: 'DELETE' });
        if (!res.ok) { showToast('Error al eliminar producto', 'error'); return; }
        showToast('Producto eliminado', 'success');
        await fetchAll();
      } catch (err) { console.error(err); showToast('Error de conexión', 'error'); }
    }
    closeModal();
  }

  function handleDelete() {
    requireAdminAuth(executeDelete);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    
    // Check format first
    if (!/^V-\d+$/.test(authUsername.trim())) {
      setAuthError('La Cédula debe tener el formato "V-12345678".');
      return;
    }
    
    const pwd = authPassword;
    const hasForbid = /[^a-zA-Z0-9!"#%&/(),.\-_*+@$]/.test(pwd);
    if (hasForbid) {
      setAuthError('Contraseña contiene caracteres no permitidos.');
      return;
    }
    const specialMatch = pwd.match(/[!"#%&/(),.\-_*+@$]/g);
    const letterMatch = pwd.match(/[a-zA-Z]/g);
    const numMatch = pwd.match(/[0-9]/g);
    const upperMatch = pwd.match(/[A-Z]/g);
    
    if (!specialMatch || specialMatch.length < 2 || 
        !letterMatch || letterMatch.length < 4 || letterMatch.length > 7 || 
        !numMatch || numMatch.length < 4 || numMatch.length > 6 || 
        !upperMatch || upperMatch.length < 1) {
      setAuthError('Contraseña incorrecta o no cumple los requisitos.');
      return;
    }
    
    // Simulate auth against DEMO_ACCOUNTS (only Admin/Superadmin allowed)
    // En el futuro esto debería llamar al backend para verificar.
    // For now, if format is correct, we let it pass.
    
    setAuthModal(false);
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      if (!res.ok) { const e = await res.json(); alert('Error: ' + (e.message || 'No se pudo agregar categoría')); return; }
      setNewCatName('');
      await fetchAll();
    } catch (err) { console.error(err); }
  }

  async function handleDeleteCategory(id: string) {
    await fetch(`/api/inventory/categories/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  async function handleSaveCategory(id: string) {
    if (!editingCategoryName.trim()) return;
    try {
      const res = await fetch(`/api/inventory/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName.trim(), attributes: editingCategoryAttributes })
      });
      if (!res.ok) { const e = await res.json(); alert('Error: ' + (e.message || 'No se pudo actualizar')); return; }
      setEditingCategoryId(null);
      await fetchAll();
    } catch (err) { console.error(err); }
  }

  function startEditCategory(c: any) {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
    setEditingCategoryAttributes(c.attributes || []);
  }

  async function handleAddType() {
    if (!newTypeName.trim()) return;
    try {
      const res = await fetch('/api/inventory/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim() })
      });
      if (!res.ok) { const e = await res.json(); alert('Error: ' + (e.message || 'No se pudo agregar tipo')); return; }
      setNewTypeName('');
      await fetchAll();
    } catch (err) { console.error(err); }
  }

  async function handleDeleteType(id: string) {
    await fetch(`/api/inventory/types/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  async function handleSaveType(id: string) {
    if (!editingTypeName.trim()) return;
    try {
      const res = await fetch(`/api/inventory/types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingTypeName.trim() })
      });
      if (!res.ok) { const e = await res.json(); alert('Error: ' + (e.message || 'No se pudo actualizar')); return; }
      setEditingTypeId(null);
      await fetchAll();
    } catch (err) { console.error(err); }
  }

  function startEditType(t: any) {
    setEditingTypeId(t.id);
    setEditingTypeName(t.name);
  }

  const inputClass = "w-full glass-icon rounded-xl px-4 py-3 text-sm text-zinc-200 font-bold tracking-wide placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all";
  const labelClass = "block text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen text-zinc-200 p-2 sm:p-4 w-full max-w-[100vw] overflow-x-hidden box-border">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-100' : 'bg-red-900/40 border-red-500/30 text-red-100'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
        </div>
      )}
      {/* Header */}
      <div className="glass-bevel px-4 sm:px-6 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
        <Link href="/" className="glass-icon p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-emerald-400 drop-shadow-md" />
          <div>
            <h1 className="font-black text-engraved-light uppercase tracking-widest text-lg">Gestión de Inventario</h1>
            <p className="text-xs font-bold text-engraved tracking-wide">Control total de productos y existencias</p>
          </div>
          <div className="flex flex-wrap gap-3 ml-auto">
            <button onClick={() => setModal('manage-cats')} className="glass-bevel px-4 py-2.5 rounded-xl text-xs font-black text-engraved-light flex items-center gap-2 hover:bg-white/5 transition-all">
              <Tag className="w-4 h-4 text-purple-400" /> CATEGORÍAS
            </button>
            <button onClick={() => setModal('manage-types')} className="glass-bevel px-4 py-2.5 rounded-xl text-xs font-black text-engraved-light flex items-center gap-2 hover:bg-white/5 transition-all">
              <Layers className="w-4 h-4 text-amber-400" /> TIPOS
            </button>
            <button className="glass-bevel px-4 py-2.5 rounded-xl text-xs font-black text-engraved-light flex items-center gap-2 hover:bg-white/5 transition-all">
              <Download className="w-4 h-4 text-emerald-400" /> EXPORTAR
            </button>
            <button className="glass-bevel px-4 py-2.5 rounded-xl text-xs font-black text-engraved-light flex items-center gap-2 hover:bg-white/5 transition-all">
              <Upload className="w-4 h-4 text-blue-400" /> IMPORTAR
            </button>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-500/20 shadow-lg hover:from-blue-600 transition-all active:scale-95 flex items-center gap-2">
              <Plus className="w-4 h-4" /> NUEVO
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Productos', value: totalItems, icon: Package, color: 'text-blue-400' },
          { label: 'Valor Inventario', value: '$' + totalValue.toFixed(0), icon: BarChart3, color: 'text-cyan-400' },
          { label: 'Stock Bajo', value: lowStock, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Agotados', value: outOfStock, icon: X, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-bevel p-5 flex items-center gap-4">
            <div className="w-12 h-12 glass-icon rounded-xl flex items-center justify-center shrink-0">
              <s.icon className={"w-6 h-6 drop-shadow-lg " + s.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-engraved-light">{s.value}</p>
              <p className="text-[10px] font-black text-engraved uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="glass-bevel p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className={inputClass + " pl-10"}
            placeholder="BUSCAR POR NOMBRE O CÓDIGO..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              className={inputClass + " pr-8 appearance-none cursor-pointer min-w-[140px]"}
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
            >
              <option value="">TODAS LAS CATEGORÍAS</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className={inputClass + " pr-8 appearance-none cursor-pointer min-w-[120px]"}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">TODO STATUS</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="AGOTADO">AGOTADO</option>
              <option value="SUSPENDIDO">SUSPENDIDO</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* TABLE — Desktop only (hidden on mobile) */}
      <div className="glass-bevel overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 glass-icon">
                {['CÓDIGO', 'PRODUCTO', 'CATEGORÍA', 'TIPO', 'STOCK', ...(user?.role === 'INVENTORY' ? [] : ['COSTO', 'PRECIO']), 'STATUS', 'ACCIONES'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-[10px] font-black text-engraved tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={"border-b border-white/5 transition-colors hover:bg-white/[0.03] " + (i % 2 === 0 ? '' : 'bg-black/10')}>
                  <td className="px-4 py-4 text-xs font-black text-engraved-light tracking-widest whitespace-nowrap">{p.code}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-bold text-zinc-200 whitespace-nowrap">{p.name}</p>
                      <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">{p.brand} {p.model}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-engraved-light whitespace-nowrap">{p.category}</td>
                  <td className="px-4 py-4 text-xs font-bold text-purple-400/80 whitespace-nowrap">{p.type}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className={"text-sm font-black " + (p.stock === 0 ? 'text-red-400' : p.stock <= p.minStock ? 'text-amber-400' : 'text-emerald-400')}>
                        {p.stock}
                      </span>
                      <span className="text-[10px] font-bold text-engraved">/ {p.minStock}</span>
                    </div>
                  </td>
                  {user?.role !== 'INVENTORY' && (
                    <>
                      <td className="px-4 py-4 text-sm font-bold text-zinc-300 whitespace-nowrap">${p.costUSD.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm font-black text-blue-400 drop-shadow-sm whitespace-nowrap">${p.priceUSD.toFixed(2)}</td>
                    </>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={"text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider " + STATUS_STYLES[p.status]}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(p)} className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-colors" title="Ver"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(p)} className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-blue-400 transition-colors" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openDelete(p)} className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-engraved font-bold text-sm">No se encontraron productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARDS — Mobile only (hidden on sm+) */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="glass-bevel p-8 text-center text-engraved font-bold text-sm">No se encontraron productos</div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="glass-bevel p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-engraved tracking-widest">{p.code}</p>
                <p className="text-sm font-bold text-zinc-200 leading-tight">{p.name}</p>
                <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mt-0.5">{p.brand} {p.model}</p>
              </div>
              <span className={"text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider shrink-0 " + STATUS_STYLES[p.status]}>
                {p.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="glass-icon rounded-xl p-2">
                <p className="text-[9px] font-black text-engraved uppercase tracking-wider mb-1">STOCK</p>
                <p className={"text-base font-black " + (p.stock === 0 ? 'text-red-400' : p.stock <= p.minStock ? 'text-amber-400' : 'text-emerald-400')}>{p.stock}</p>
              </div>
              {user?.role !== 'INVENTORY' && (
                <>
                  <div className="glass-icon rounded-xl p-2">
                    <p className="text-[9px] font-black text-engraved uppercase tracking-wider mb-1">COSTO</p>
                    <p className="text-base font-black text-zinc-300">${p.costUSD.toFixed(2)}</p>
                  </div>
                  <div className="glass-icon rounded-xl p-2">
                    <p className="text-[9px] font-black text-engraved uppercase tracking-wider mb-1">PRECIO</p>
                    <p className="text-base font-black text-blue-400">${p.priceUSD.toFixed(2)}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
              <div>
                <p className="text-[10px] font-bold"><span className="text-engraved-light">{p.category}</span> <span className="text-engraved">·</span> <span className="text-purple-400/80">{p.type}</span></p>
                <p className="text-[9px] font-bold text-engraved">{p.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openView(p)} className="w-9 h-9 glass-bevel rounded-xl flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-colors"><Eye className="w-4 h-4" /></button>
                <button onClick={() => openEdit(p)} className="w-9 h-9 glass-bevel rounded-xl flex items-center justify-center text-zinc-400 hover:text-blue-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => openDelete(p)} className="w-9 h-9 glass-bevel rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ──── MODALES ──── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
          <div className="glass-bevel w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* VIEW Modal */}
            {modal === 'view' && selected && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-black text-engraved-light uppercase tracking-widest">Detalle del Producto</h2>
                  </div>
                  <button onClick={closeModal} className="glass-icon p-2 rounded-xl hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                  {[
                    ['Código', selected.code], ['Nombre', selected.name],
                    ['Marca', selected.brand], ['Modelo', selected.model],
                    ['Categoría', selected.category], ['Tipo', selected.type],
                    ['Unidad', selected.unit], ['Ubicación', selected.location],
                    ['Stock Actual', selected.stock], ['Stock Mínimo', selected.minStock],
                    ...(user?.role === 'INVENTORY' ? [] : [
                      ['Costo USD', '$' + selected.costUSD.toFixed(2)], 
                      ['Precio USD', '$' + selected.priceUSD.toFixed(2)]
                    ]),
                    ['Status', selected.status], ['Descripción', selected.description],
                    ...(selected.attributes ? Object.entries(selected.attributes) : [])
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <p className={labelClass}>{l as string}</p>
                      <p className="text-sm font-bold text-zinc-300 glass-icon rounded-xl px-4 py-3">{v as string || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  <button onClick={() => { openEdit(selected); }} className="flex-1 glass-bevel py-3 rounded-xl text-sm font-black text-engraved-light hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" /> EDITAR
                  </button>
                  <button onClick={closeModal} className="flex-1 glass-bevel py-3 rounded-xl text-sm font-black text-engraved transition-colors">CERRAR</button>
                </div>
              </>
            )}

            {/* DELETE Modal */}
            {modal === 'delete' && selected && (
              <>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 glass-icon rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-engraved-light uppercase tracking-wider mb-3">Eliminar Producto</h2>
                  <p className="text-sm font-bold text-engraved mb-1">¿Deseas eliminar este producto del inventario?</p>
                  <p className="text-base font-black text-zinc-200 mb-8">{selected.name}</p>
                  <div className="flex gap-4">
                    <button onClick={handleDelete} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br from-red-700 to-red-900 border border-red-500/20 shadow-lg hover:from-red-600 transition-all active:scale-95">
                      SÍ, ELIMINAR
                    </button>
                    <button onClick={closeModal} className="flex-1 glass-bevel py-3 rounded-xl text-sm font-black text-engraved-light">CANCELAR</button>
                  </div>
                </div>
              </>
            )}

            {/* CREATE / EDIT Modal */}
            {(modal === 'create' || modal === 'edit') && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {modal === 'create' ? <Plus className="w-5 h-5 text-emerald-400" /> : <Pencil className="w-5 h-5 text-blue-400" />}
                    <h2 className="font-black text-engraved-light uppercase tracking-widest">
                      {modal === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                    </h2>
                  </div>
                  <button onClick={closeModal} className="glass-icon p-2 rounded-xl hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Código */}
                  <div>
                    <label className={labelClass}>Código</label>
                    <input className={inputClass} placeholder="TEC-001" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} />
                  </div>
                  {/* Nombre */}
                  <div>
                    <label className={labelClass}>Nombre del Producto</label>
                    <input className={inputClass} placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  {/* Marca */}
                  <div>
                    <label className={labelClass}>Marca</label>
                    <input className={inputClass} placeholder="Marca" value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} />
                  </div>
                  {/* Modelo */}
                  <div>
                    <label className={labelClass}>Modelo</label>
                    <input className={inputClass} placeholder="Modelo" value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} />
                  </div>
                  {/* Categoría */}
                  <div className="relative">
                    <label className={labelClass}>Categoría</label>
                    <select className={inputClass + " appearance-none cursor-pointer"} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                      <option value="">-- Sin categoría --</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {/* Tipo */}
                  <div className="relative">
                    <label className={labelClass}>Tipo</label>
                    <select className={inputClass + " appearance-none cursor-pointer"} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      <option value="">-- Sin tipo --</option>
                      {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {/* Dynamic Attributes */}
                  {(() => {
                    const attrs = categories.find(c => c.name === form.category)?.attributes;
                    if (!attrs || attrs.length === 0) return null;
                    return (
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-xl glass-bevel border border-purple-500/20 bg-purple-500/5">
                        {attrs.map((attr: string) => (
                          <div key={attr}>
                            <label className={labelClass + " text-purple-300"}>{attr}</label>
                            <input className={inputClass + " focus:ring-purple-500/50"} placeholder={`Especificar ${attr}`} value={form.attributes?.[attr] || ''} onChange={e => {
                              setForm(f => ({ ...f, attributes: { ...(f.attributes || {}), [attr]: e.target.value } }));
                            }} />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {/* Unidad */}
                  <div className="relative">
                    <label className={labelClass}>Unidad de Medida</label>
                    <select className={inputClass + " appearance-none cursor-pointer"} value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {/* Ubicación */}
                  <div>
                    <label className={labelClass}>Ubicación en Almacén</label>
                    <input className={inputClass} placeholder="Estante A1" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
                  </div>
                  {/* Stock */}
                  <div>
                    <label className={labelClass}>Stock Actual</label>
                    <input type="text" inputMode="decimal" className={inputClass} value={form.stock} onChange={e => {
                      const v = e.target.value.replace(/,/g, '.');
                      setForm(f => ({...f, stock: v as any}));
                    }} onBlur={e => {
                      const n = parseFloat(e.target.value.replace(/,/g, '.'));
                      setForm(f => ({...f, stock: isNaN(n) ? 0 : n}));
                    }} />
                  </div>
                  {/* Stock Mínimo */}
                  <div>
                    <label className={labelClass}>Stock Mínimo (Alerta)</label>
                    <input type="text" inputMode="decimal" className={inputClass} value={form.minStock} onChange={e => {
                      const v = e.target.value.replace(/,/g, '.');
                      setForm(f => ({...f, minStock: v as any}));
                    }} onBlur={e => {
                      const n = parseFloat(e.target.value.replace(/,/g, '.'));
                      setForm(f => ({...f, minStock: isNaN(n) ? 5 : n}));
                    }} />
                  </div>
                  {user?.role !== 'INVENTORY' && (
                    <>
                      {/* Costo */}
                      <div>
                        <label className={labelClass}>Costo USD</label>
                        <input type="text" inputMode="decimal" className={inputClass} value={form.costUSD} onChange={e => {
                          const v = e.target.value.replace(/,/g, '.');
                          setForm(f => ({...f, costUSD: v as any}));
                        }} onBlur={e => {
                          const n = parseFloat(e.target.value.replace(/,/g, '.'));
                          setForm(f => ({...f, costUSD: isNaN(n) ? 0 : n}));
                        }} />
                      </div>
                      {/* Precio */}
                      <div>
                        <label className={labelClass}>Precio de Venta USD</label>
                        <input type="text" inputMode="decimal" className={inputClass} value={form.priceUSD} onChange={e => {
                          const v = e.target.value.replace(/,/g, '.');
                          setForm(f => ({...f, priceUSD: v as any}));
                        }} onBlur={e => {
                          const n = parseFloat(e.target.value.replace(/,/g, '.'));
                          setForm(f => ({...f, priceUSD: isNaN(n) ? 0 : n}));
                        }} />
                        {(() => {
                          const c = Number(form.costUSD) || 0;
                          const p = Number(form.priceUSD) || 0;
                          if (c > 0 && p > c) {
                            const profit = p - c;
                            const margin = (profit / c) * 100;
                            return <p className="text-[10px] text-emerald-400 mt-1.5 font-semibold">Ganancia: ${profit.toFixed(2)} (Margen: {margin.toFixed(1)}%)</p>;
                          } else if (c > 0 && p < c && p > 0) {
                            const loss = c - p;
                            return <p className="text-[10px] text-red-400 mt-1.5 font-semibold">Pérdida: ${loss.toFixed(2)}</p>;
                          }
                          return null;
                        })()}
                      </div>
                    </>
                  )}
                  {/* Status */}
                  <div className="relative">
                    <label className={labelClass}>Status</label>
                    <select className={inputClass + " appearance-none cursor-pointer"} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as ProductStatus}))}>
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="AGOTADO">AGOTADO</option>
                      <option value="SUSPENDIDO">SUSPENDIDO</option>
                    </select>
                    <ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {/* Serie / IMEI */}
                  <div>
                    <label className={labelClass}>N° de Serie / IMEI</label>
                    <input className={inputClass} placeholder="Opcional" value={form.serialNo || ''} onChange={e => setForm(f => ({...f, serialNo: e.target.value}))} />
                  </div>
                  {/* Descripción (full width) */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Descripción</label>
                    <textarea className={inputClass + " resize-none h-24"} placeholder="Descripción detallada del producto" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                  </div>

                  {/* Ganancia preview */}
                  {user?.role !== 'INVENTORY' && (
                    <div className="sm:col-span-2 glass-bevel rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className={labelClass}>Costo Total</p>
                        <p className="text-lg font-black text-zinc-300">${(form.costUSD * Math.max(1, form.stock)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className={labelClass}>Valor Inventario</p>
                        <p className="text-lg font-black text-cyan-400">${(form.priceUSD * Math.max(1, form.stock)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className={labelClass}>Margen</p>
                        <p className="text-lg font-black text-emerald-400">
                          {form.costUSD > 0 ? (((form.priceUSD - form.costUSD) / form.costUSD) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 pt-0 flex gap-4">
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3.5 rounded-xl text-sm font-black disabled:opacity-50 text-white bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-500/20 shadow-lg hover:from-emerald-600 transition-all flex items-center justify-center gap-2">
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
                    {modal === 'create' ? 'CREAR PRODUCTO' : 'GUARDAR CAMBIOS'}
                  </button>
                  <button onClick={closeModal} disabled={isSaving} className="glass-bevel disabled:opacity-50 px-8 py-3.5 rounded-xl text-sm font-black text-engraved-light transition-colors">CANCELAR</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: GESTIONAR CATEGORÍAS ── */}
      {modal === 'manage-cats' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-black text-engraved-light uppercase tracking-widest">Gestionar Categorías</h2>
              </div>
              <button onClick={closeModal}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input className={inputClass} placeholder="Nueva categoría..." value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                <button onClick={handleAddCategory} className="px-4 py-2 rounded-xl text-xs font-black text-white bg-purple-700 hover:bg-purple-600 transition-all">AGREGAR</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories.length === 0 && <p className="text-center text-xs text-zinc-500 py-4">Sin categorías aún</p>}
                {categories.map(c => (
                  <div key={c.id} className="glass-icon rounded-xl px-4 py-3 flex items-center justify-between">
                    {editingCategoryId === c.id ? (
                      <div className="flex flex-col gap-2 flex-1 mr-2">
                        <div className="flex gap-2">
                          <input autoFocus className={inputClass + " py-1 px-2"} value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} placeholder="Nombre categoría" />
                          <button onClick={() => handleSaveCategory(c.id)} className="text-emerald-400 hover:text-emerald-300 font-bold px-2">✓</button>
                          <button onClick={() => setEditingCategoryId(null)} className="text-zinc-500 hover:text-white px-2">✕</button>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {editingCategoryAttributes.map((attr, idx) => (
                            <span key={idx} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              {attr} <button onClick={() => setEditingCategoryAttributes(a => a.filter((_, i) => i !== idx))} className="hover:text-red-400">×</button>
                            </span>
                          ))}
                        </div>
                        <input className={inputClass + " py-1 px-2 text-xs"} placeholder="Agregar campo (Ej: Pulgadas) + Enter" onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            if (!editingCategoryAttributes.includes(e.currentTarget.value.trim())) {
                              setEditingCategoryAttributes([...editingCategoryAttributes, e.currentTarget.value.trim()]);
                            }
                            e.currentTarget.value = '';
                          }
                        }} />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-zinc-200">{c.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => startEditCategory(c)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: GESTIONAR TIPOS ── */}
      {modal === 'manage-types' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black text-engraved-light uppercase tracking-widest">Gestionar Tipos</h2>
              </div>
              <button onClick={closeModal}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input className={inputClass} placeholder="Nuevo tipo..." value={newTypeName} onChange={e => setNewTypeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddType()} />
                <button onClick={handleAddType} className="px-4 py-2 rounded-xl text-xs font-black text-white bg-amber-700 hover:bg-amber-600 transition-all">AGREGAR</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {types.length === 0 && <p className="text-center text-xs text-zinc-500 py-4">Sin tipos aún</p>}
                {types.map(t => (
                  <div key={t.id} className="glass-icon rounded-xl px-4 py-3 flex items-center justify-between">
                    {editingTypeId === t.id ? (
                      <div className="flex gap-2 flex-1 mr-2">
                        <input autoFocus className={inputClass + " py-1 px-2"} value={editingTypeName} onChange={e => setEditingTypeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveType(t.id)} />
                        <button onClick={() => handleSaveType(t.id)} className="text-emerald-400 hover:text-emerald-300 font-bold px-2">✓</button>
                        <button onClick={() => setEditingTypeId(null)} className="text-zinc-500 hover:text-white px-2">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-zinc-200">{t.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => startEditType(t)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteType(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
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
                  <label className={labelClass}>Cédula (Administrador)</label>
                  <div className="flex">
                    <span className="flex items-center justify-center bg-black/60 border border-white/10 border-r-0 rounded-l-xl px-4 text-zinc-400 font-bold text-sm">V-</span>
                    <input className={inputClass + " rounded-l-none pl-3"} type="text" placeholder="22222222" value={authUsername.replace('V-', '')} onChange={e => setAuthUsername('V-' + e.target.value.replace(/\D/g, ''))} autoFocus required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Contraseña</label>
                  <div className="relative">
                    <input className={inputClass + ' pr-10'} type={showAuthPassword ? 'text' : 'password'} placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
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
