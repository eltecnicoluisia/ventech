const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'apps/web/app');

// ─────────────────────────────────────────────
// INVENTORY PAGE - Full CRUD Module
// ─────────────────────────────────────────────
const inventoryPage = `'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Eye, Pencil, Trash2, Package,
  Tag, Layers, Hash, BarChart3, AlertTriangle, CheckCircle,
  Filter, Download, Upload, X, Save, ChevronDown
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
}

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: 'TEC-001', name: 'Teclado Mecánico RGB', category: 'Periféricos', type: 'Hardware', unit: 'Unidad', stock: 15, minStock: 5, costUSD: 28, priceUSD: 45, status: 'ACTIVO', description: 'Teclado mecánico con retroiluminación RGB', brand: 'TechPro', model: 'TK-200', location: 'Estante A1' },
  { id: '2', code: 'MOU-001', name: 'Mouse Inalámbrico', category: 'Periféricos', type: 'Hardware', unit: 'Unidad', stock: 32, minStock: 10, costUSD: 15, priceUSD: 28.5, status: 'ACTIVO', description: 'Mouse inalámbrico 2.4GHz', brand: 'LogiMax', model: 'MX-100', location: 'Estante A2' },
  { id: '3', code: 'MON-001', name: 'Monitor 24" Full HD', category: 'Monitores', type: 'Hardware', unit: 'Unidad', stock: 8, minStock: 3, costUSD: 120, priceUSD: 185, status: 'ACTIVO', description: 'Monitor LED Full HD 1920x1080', brand: 'Samsung', model: 'S24F350', location: 'Bodega B1' },
  { id: '4', code: 'ACC-001', name: 'USB-C Hub 7 en 1', category: 'Accesorios', type: 'Hardware', unit: 'Unidad', stock: 0, minStock: 5, costUSD: 20, priceUSD: 35, status: 'AGOTADO', description: 'Hub USB-C con 7 puertos', brand: 'Anker', model: 'A8346', location: 'Estante C1' },
  { id: '5', code: 'CAM-001', name: 'Webcam 1080p', category: 'Cámaras', type: 'Hardware', unit: 'Unidad', stock: 12, minStock: 4, costUSD: 32, priceUSD: 55, status: 'ACTIVO', description: 'Webcam Full HD con micrófono integrado', brand: 'Logitech', model: 'C920', location: 'Estante A3' },
  { id: '6', code: 'AUD-001', name: 'Auriculares Bluetooth', category: 'Audio', type: 'Hardware', unit: 'Unidad', stock: 18, minStock: 6, costUSD: 25, priceUSD: 40, status: 'ACTIVO', description: 'Auriculares Bluetooth 5.0', brand: 'JBL', model: 'Tune 510BT', location: 'Estante B2' },
];

const CATEGORIES = ['Periféricos', 'Monitores', 'Accesorios', 'Cámaras', 'Audio', 'Redes', 'Software', 'Consumibles', 'Otros'];
const TYPES = ['Hardware', 'Software', 'Consumible', 'Servicio', 'Materia Prima'];
const UNITS = ['Unidad', 'Caja', 'Par', 'Docena', 'Litro', 'Kg', 'Metro'];

const STATUS_STYLES: Record<ProductStatus, string> = {
  ACTIVO: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  AGOTADO: 'text-red-400 bg-red-500/10 border border-red-500/20',
  SUSPENDIDO: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
};

const EMPTY: Product = {
  id: '', code: '', name: '', category: 'Periféricos', type: 'Hardware',
  unit: 'Unidad', stock: 0, minStock: 0, costUSD: 0, priceUSD: 0,
  status: 'ACTIVO', description: '', brand: '', model: '', location: ''
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState<null | 'view' | 'edit' | 'create' | 'delete'>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>(EMPTY);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? p.category === filterCat : true;
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchCat && matchStatus;
  });

  const totalItems = products.length;
  const totalValue = products.reduce((s, p) => s + p.stock * p.priceUSD, 0);
  const lowStock = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  function openView(p: Product) { setSelected(p); setModal('view'); }
  function openEdit(p: Product) { setForm({ ...p }); setModal('edit'); }
  function openCreate() { setForm({ ...EMPTY, id: Date.now().toString() }); setModal('create'); }
  function openDelete(p: Product) { setSelected(p); setModal('delete'); }
  function closeModal() { setModal(null); setSelected(null); }

  function handleSave() {
    if (modal === 'create') {
      setProducts(prev => [form, ...prev]);
    } else if (modal === 'edit') {
      setProducts(prev => prev.map(p => p.id === form.id ? form : p));
    }
    closeModal();
  }

  function handleDelete() {
    if (selected) setProducts(prev => prev.filter(p => p.id !== selected.id));
    closeModal();
  }

  const inputClass = "w-full glass-icon rounded-xl px-4 py-3 text-sm text-zinc-200 font-bold tracking-wide placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all";
  const labelClass = "block text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen text-zinc-200 p-4">
      {/* Header */}
      <div className="glass-bevel px-6 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/" className="glass-icon p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-emerald-400 drop-shadow-md" />
          <div>
            <h1 className="font-black text-engraved-light uppercase tracking-widest text-lg">Gestión de Inventario</h1>
            <p className="text-xs font-bold text-engraved tracking-wide">Control total de productos y existencias</p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <button className="glass-bevel px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black text-engraved-light hover:text-emerald-400 transition-colors">
            <Download className="w-4 h-4" /> EXPORTAR
          </button>
          <button className="glass-bevel px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black text-engraved-light hover:text-cyan-400 transition-colors">
            <Upload className="w-4 h-4" /> IMPORTAR
          </button>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black tracking-wider text-white bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-500/20 shadow-lg hover:from-emerald-600 hover:to-emerald-800 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> NUEVO PRODUCTO
          </button>
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
              {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
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

      {/* Table */}
      <div className="glass-bevel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 glass-icon">
                {['CÓDIGO', 'PRODUCTO', 'CATEGORÍA', 'TIPO', 'STOCK', 'COSTO', 'PRECIO', 'STATUS', 'ACCIONES'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-engraved tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={"border-b border-white/5 transition-colors hover:bg-white/[0.03] " + (i % 2 === 0 ? '' : 'bg-black/10')}>
                  <td className="px-5 py-4 text-xs font-black text-engraved-light tracking-widest">{p.code}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{p.name}</p>
                      <p className="text-[10px] font-bold text-engraved">{p.brand} {p.model}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-engraved-light">{p.category}</td>
                  <td className="px-5 py-4 text-xs font-bold text-engraved">{p.type}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={"text-sm font-black " + (p.stock === 0 ? 'text-red-400' : p.stock <= p.minStock ? 'text-amber-400' : 'text-emerald-400')}>
                        {p.stock}
                      </span>
                      <span className="text-[10px] font-bold text-engraved">/ min {p.minStock}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-engraved">\${p.costUSD.toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm font-black text-blue-400 drop-shadow-sm">\${p.priceUSD.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={"text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider " + STATUS_STYLES[p.status]}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openView(p)}
                        className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(p)}
                        className="w-8 h-8 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-engraved font-bold text-sm">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──── MODALES ──── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
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
                    ['Costo USD', '\$' + selected.costUSD.toFixed(2)], ['Precio USD', '\$' + selected.priceUSD.toFixed(2)],
                    ['Status', selected.status], ['Descripción', selected.description],
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
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {/* Tipo */}
                  <div className="relative">
                    <label className={labelClass}>Tipo</label>
                    <select className={inputClass + " appearance-none cursor-pointer"} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
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
                    <input type="number" min="0" className={inputClass} value={form.stock} onChange={e => setForm(f => ({...f, stock: Number(e.target.value)}))} />
                  </div>
                  {/* Stock Mínimo */}
                  <div>
                    <label className={labelClass}>Stock Mínimo (Alerta)</label>
                    <input type="number" min="0" className={inputClass} value={form.minStock} onChange={e => setForm(f => ({...f, minStock: Number(e.target.value)}))} />
                  </div>
                  {/* Costo */}
                  <div>
                    <label className={labelClass}>Costo USD</label>
                    <input type="number" min="0" step="0.01" className={inputClass} value={form.costUSD} onChange={e => setForm(f => ({...f, costUSD: Number(e.target.value)}))} />
                  </div>
                  {/* Precio */}
                  <div>
                    <label className={labelClass}>Precio de Venta USD</label>
                    <input type="number" min="0" step="0.01" className={inputClass} value={form.priceUSD} onChange={e => setForm(f => ({...f, priceUSD: Number(e.target.value)}))} />
                  </div>
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
                  <div className="sm:col-span-2 glass-bevel rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={labelClass}>Costo Total</p>
                      <p className="text-lg font-black text-zinc-300">\${(form.costUSD * Math.max(1, form.stock)).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={labelClass}>Valor Inventario</p>
                      <p className="text-lg font-black text-cyan-400">\${(form.priceUSD * Math.max(1, form.stock)).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={labelClass}>Margen</p>
                      <p className="text-lg font-black text-emerald-400">
                        {form.costUSD > 0 ? (((form.priceUSD - form.costUSD) / form.costUSD) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 flex gap-4">
                  <button onClick={handleSave} className="flex-1 py-3.5 rounded-xl text-sm font-black text-white bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-500/20 shadow-lg hover:from-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> {modal === 'create' ? 'CREAR PRODUCTO' : 'GUARDAR CAMBIOS'}
                  </button>
                  <button onClick={closeModal} className="glass-bevel px-8 py-3.5 rounded-xl text-sm font-black text-engraved-light transition-colors">CANCELAR</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`;

// Write inventory page
const invDir = path.join(baseDir, 'inventory');
fs.mkdirSync(invDir, { recursive: true });
fs.writeFileSync(path.join(invDir, 'page.tsx'), inventoryPage, 'utf8');

console.log('✅ Inventory page created successfully in UTF-8');
