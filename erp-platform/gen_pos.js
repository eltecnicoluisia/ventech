const fs = require('fs');
const path = require('path');

const posPage = `'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePosStore } from '../../store/posStore';
import {
  ShoppingCart, X, Plus, Minus, DollarSign, Zap, Search,
  ArrowLeft, Wifi, WifiOff, CheckCircle, CreditCard, Landmark,
  Eye, Pencil, Package
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  variantId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand?: string;
  model?: string;
  description?: string;
  code?: string;
}

const MOCK_PRODUCTS: Product[] = [
  { variantId: 'v1', code: 'TEC-001', name: 'Teclado Mecánico RGB', price: 45.00, stock: 15, category: 'Periféricos', brand: 'TechPro', model: 'TK-200', description: 'Teclado mecánico con retroiluminación RGB' },
  { variantId: 'v2', code: 'MOU-001', name: 'Mouse Inalámbrico', price: 28.50, stock: 32, category: 'Periféricos', brand: 'LogiMax', model: 'MX-100', description: 'Mouse inalámbrico 2.4GHz' },
  { variantId: 'v3', code: 'MON-001', name: 'Monitor 24" Full HD', price: 185.00, stock: 8, category: 'Monitores', brand: 'Samsung', model: 'S24F350', description: 'Monitor LED Full HD 1920x1080' },
  { variantId: 'v4', code: 'ACC-001', name: 'USB-C Hub 7 en 1', price: 35.00, stock: 20, category: 'Accesorios', brand: 'Anker', model: 'A8346', description: 'Hub USB-C con 7 puertos' },
  { variantId: 'v5', code: 'CAM-001', name: 'Webcam 1080p', price: 55.00, stock: 12, category: 'Cámaras', brand: 'Logitech', model: 'C920', description: 'Webcam Full HD con micrófono integrado' },
  { variantId: 'v6', code: 'AUD-001', name: 'Auriculares Bluetooth', price: 40.00, stock: 18, category: 'Audio', brand: 'JBL', model: 'Tune 510BT', description: 'Auriculares Bluetooth 5.0' },
];

export default function PosPage() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalUSD, getTotalVES, exchangeRate } = usePosStore();
  const [isOnline, setIsOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'VES'>('USD');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [editForm, setEditForm] = useState<Product | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalUSD = getTotalUSD();
  const igtf = paymentMethod === 'CASH' && paymentCurrency === 'USD' ? totalUSD * 0.03 : 0;
  const grandTotal = totalUSD + igtf;
  const grandTotalVES = grandTotal * exchangeRate;

  const handleCheckout = useCallback(async () => {
    setCheckoutSuccess(true);
    setTimeout(() => { clearCart(); setCheckoutSuccess(false); }, 2000);
  }, [clearCart]);

  function openEdit(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setEditForm({ ...p });
    setEditProduct(p);
  }
  function openView(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setViewProduct(p);
  }
  function saveEdit() {
    if (editForm) {
      setProducts(prev => prev.map(p => p.variantId === editForm.variantId ? editForm : p));
    }
    setEditProduct(null);
    setEditForm(null);
  }

  const inputClass = "w-full glass-icon rounded-xl px-4 py-3 text-sm text-zinc-200 font-bold tracking-wide placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all";
  const labelClass = "block text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5";

  if (checkoutSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-bevel p-12 text-center rounded-2xl max-w-sm w-full">
          <CheckCircle className="w-24 h-24 text-emerald-500 drop-shadow-lg mx-auto mb-6" />
          <h2 className="text-3xl font-black text-engraved uppercase tracking-wider mb-2">¡Completado!</h2>
          <p className="text-engraved-light font-bold">Procesando recibo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden text-zinc-200">

      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="glass-bevel m-4 mb-2 px-4 py-4 flex flex-col sm:flex-row items-center gap-4 z-10">
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
            <Link href="/" className="glass-icon p-2 rounded-xl hover:bg-zinc-700/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500 drop-shadow-md" />
              <span className="font-black text-engraved-light tracking-wider uppercase">POS VENTECH</span>
            </div>
            <div className={\`sm:hidden flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full shadow-inner \${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}\`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input className={inputClass + " pl-10"} placeholder="BUSCAR PRODUCTO..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <div className={\`hidden sm:flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full shadow-inner \${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}\`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <Link href="/inventory" className="glass-bevel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-engraved-light hover:text-emerald-400 transition-colors">
              <Package className="w-4 h-4" /> NUEVO
            </Link>
          </div>
        </div>

        {/* Exchange Rate Banner */}
        <div className="mx-4 mb-2 flex flex-col sm:flex-row gap-2 sm:gap-6 px-5 py-3 glass-bevel text-xs font-bold">
          <span className="text-engraved-light tracking-wider">💱 TASA BCV: <strong className="text-cyan-400 text-sm ml-1 drop-shadow-md">Bs. {exchangeRate.toFixed(2)}</strong></span>
          <span className="text-engraved-light tracking-wider">💰 IGTF DIVISAS: <strong className="text-amber-400 text-sm ml-1 drop-shadow-md">3%</strong></span>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div key={product.variantId} className="group flex flex-col glass-bevel">
                {/* Action buttons row */}
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <span className="text-[9px] font-black text-engraved tracking-widest uppercase">{product.code}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={e => openView(product, e)}
                      className="w-6 h-6 glass-icon rounded-md flex items-center justify-center text-zinc-500 hover:text-cyan-400 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => openEdit(product, e)}
                      className="w-6 h-6 glass-icon rounded-md flex items-center justify-center text-zinc-500 hover:text-blue-400 transition-colors"
                      title="Editar producto"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Product card body — click to add to cart */}
                <button
                  onClick={() => addItem({ variantId: product.variantId, name: product.name, price: product.price, quantity: 1 })}
                  className="flex flex-col items-start text-left p-3 pt-1 flex-1 active:scale-95 transition-transform"
                >
                  <div className="w-full aspect-video glass-icon rounded-xl mb-3 flex items-center justify-center text-zinc-600 group-hover:text-blue-500 transition-colors">
                    <ShoppingCart className="w-8 h-8 drop-shadow-lg" />
                  </div>
                  <p className="text-[9px] font-black text-engraved uppercase tracking-widest mb-1">{product.category}</p>
                  <h3 className="text-sm font-bold text-zinc-300 leading-snug mb-3 flex-1 w-full">{product.name}</h3>
                  <div className="flex items-end justify-between w-full">
                    <span className="text-lg font-black text-engraved-light">\${product.price.toFixed(2)}</span>
                    <span className={"text-[9px] font-black px-2 py-1 glass-icon rounded-md " + (product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-amber-400' : 'text-emerald-400')}>
                      STOCK: {product.stock}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-full lg:w-[420px] flex flex-col glass-bevel lg:m-4 lg:ml-0 mt-0 lg:mt-4 overflow-hidden rounded-t-3xl lg:rounded-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between glass-icon rounded-none shadow-sm">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-blue-400 drop-shadow-md" />
            <span className="font-black text-engraved-light uppercase tracking-widest">Orden Actual</span>
          </div>
          {items.length > 0 && (
            <span className="text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1">{items.length} ITEMS</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] lg:min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-12">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-bold tracking-widest uppercase">Carrito Vacío</p>
            </div>
          ) : items.map((item) => (
            <div key={item.variantId} className="flex items-center gap-3 glass-icon rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                <p className="text-xs font-bold text-engraved">\${item.price.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1 shadow-inner">
                <button onClick={() => item.quantity > 1 ? updateQuantity(item.variantId, item.quantity - 1) : removeItem(item.variantId)} className="w-8 h-8 rounded-md glass-bevel flex items-center justify-center hover:bg-zinc-700/50 transition-colors">
                  <Minus className="w-3 h-3 text-zinc-300" />
                </button>
                <span className="text-sm font-black w-6 text-center text-zinc-300">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-8 h-8 rounded-md glass-bevel flex items-center justify-center hover:bg-zinc-700/50 transition-colors">
                  <Plus className="w-3 h-3 text-blue-400" />
                </button>
              </div>
              <button onClick={() => removeItem(item.variantId)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group">
                <X className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-5 glass-icon rounded-none border-t border-white/5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-engraved tracking-widest uppercase mb-2">Método de Pago</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'CASH', icon: DollarSign, label: 'EFC' }, { id: 'CARD', icon: CreditCard, label: 'TARJ' }, { id: 'TRANSFER', icon: Landmark, label: 'TRANS' }].map(m => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id as any)} className={\`flex flex-col items-center justify-center py-2 rounded-lg font-bold text-[10px] transition-all border \${paymentMethod === m.id ? 'bg-zinc-800/80 border-blue-500/30 text-blue-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]' : 'glass-bevel border-transparent text-zinc-500 hover:text-zinc-300'}\`}>
                    <m.icon className="w-4 h-4 mb-1" /> {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-engraved tracking-widest uppercase mb-2">Moneda</p>
              <div className="grid grid-cols-2 gap-2">
                {(['USD', 'VES'] as const).map(c => (
                  <button key={c} onClick={() => setPaymentCurrency(c)} className={\`py-3 rounded-lg font-black text-xs tracking-wider transition-all border \${paymentCurrency === c ? 'bg-zinc-800/80 border-cyan-500/30 text-cyan-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]' : 'glass-bevel border-transparent text-zinc-500 hover:text-zinc-300'}\`}>
                    {c === 'USD' ? '🇺🇸 USD' : '🇻🇪 VES'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-bevel rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm font-bold text-engraved-light"><span>SUBTOTAL:</span><span>\${totalUSD.toFixed(2)}</span></div>
            {igtf > 0 && <div className="flex justify-between text-sm font-bold text-amber-500"><span>IGTF (3%):</span><span>\${igtf.toFixed(2)}</span></div>}
            <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
              <span className="text-sm font-black text-engraved tracking-widest uppercase">Total USD:</span>
              <span className="text-xl font-black text-blue-400 drop-shadow-md">\${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-engraved tracking-widest uppercase">Total VES:</span>
              <span className="font-black text-cyan-400 drop-shadow-md">Bs. {grandTotalVES.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={items.length === 0} className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600 disabled:from-zinc-800 disabled:to-zinc-800 border border-white/10 disabled:border-transparent disabled:text-zinc-600 text-white font-black tracking-wider py-4 rounded-xl text-base transition-all active:scale-95 shadow-lg disabled:shadow-none">
            <ShoppingCart className="w-5 h-5" />
            {paymentCurrency === 'USD' ? \`COBRAR \$\${grandTotal.toFixed(2)}\` : \`COBRAR BS. \${grandTotalVES.toFixed(2)}\`}
          </button>
        </div>
      </div>

      {/* ──── MODAL VER PRODUCTO ──── */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewProduct(null)}>
          <div className="glass-bevel w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h2 className="font-black text-engraved-light uppercase tracking-widest">Detalle del Producto</h2>
              </div>
              <button onClick={() => setViewProduct(null)} className="glass-icon p-2 rounded-xl hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Código', viewProduct.code], ['Nombre', viewProduct.name],
                ['Marca', viewProduct.brand], ['Modelo', viewProduct.model],
                ['Categoría', viewProduct.category], ['Precio', '\$' + viewProduct.price.toFixed(2)],
                ['Stock', viewProduct.stock], ['Descripción', viewProduct.description],
              ].map(([l, v]) => (
                <div key={l as string}>
                  <p className={labelClass}>{l as string}</p>
                  <p className="text-sm font-bold text-zinc-300 glass-icon rounded-xl px-4 py-3">{v as string || '—'}</p>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={e => { setViewProduct(null); openEdit(viewProduct, e as any); }} className="flex-1 glass-bevel py-3 rounded-xl text-sm font-black text-engraved-light hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
                <Pencil className="w-4 h-4" /> EDITAR
              </button>
              <button onClick={() => { addItem({ variantId: viewProduct.variantId, name: viewProduct.name, price: viewProduct.price, quantity: 1 }); setViewProduct(null); }} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br from-blue-700 to-cyan-800 border border-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                <ShoppingCart className="w-4 h-4" /> AGREGAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL EDITAR PRODUCTO ──── */}
      {editProduct && editForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setEditProduct(null); setEditForm(null); }}>
          <div className="glass-bevel w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Pencil className="w-5 h-5 text-blue-400" />
                <h2 className="font-black text-engraved-light uppercase tracking-widest">Editar Producto</h2>
              </div>
              <button onClick={() => { setEditProduct(null); setEditForm(null); }} className="glass-icon p-2 rounded-xl hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Código</label><input className={inputClass} value={editForm.code || ''} onChange={e => setEditForm(f => f ? {...f, code: e.target.value} : f)} /></div>
              <div><label className={labelClass}>Nombre</label><input className={inputClass} value={editForm.name} onChange={e => setEditForm(f => f ? {...f, name: e.target.value} : f)} /></div>
              <div><label className={labelClass}>Marca</label><input className={inputClass} value={editForm.brand || ''} onChange={e => setEditForm(f => f ? {...f, brand: e.target.value} : f)} /></div>
              <div><label className={labelClass}>Modelo</label><input className={inputClass} value={editForm.model || ''} onChange={e => setEditForm(f => f ? {...f, model: e.target.value} : f)} /></div>
              <div><label className={labelClass}>Categoría</label><input className={inputClass} value={editForm.category} onChange={e => setEditForm(f => f ? {...f, category: e.target.value} : f)} /></div>
              <div><label className={labelClass}>Stock Actual</label><input type="number" className={inputClass} value={editForm.stock} onChange={e => setEditForm(f => f ? {...f, stock: Number(e.target.value)} : f)} /></div>
              <div><label className={labelClass}>Precio USD</label><input type="number" step="0.01" className={inputClass} value={editForm.price} onChange={e => setEditForm(f => f ? {...f, price: Number(e.target.value)} : f)} /></div>
              <div className="col-span-2"><label className={labelClass}>Descripción</label><textarea className={inputClass + " resize-none h-20"} value={editForm.description || ''} onChange={e => setEditForm(f => f ? {...f, description: e.target.value} : f)} /></div>
            </div>
            <div className="p-6 pt-0 flex gap-4">
              <button onClick={saveEdit} className="flex-1 py-3.5 rounded-xl text-sm font-black text-white bg-gradient-to-br from-blue-700 to-cyan-800 border border-blue-500/20 shadow-lg hover:from-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                GUARDAR CAMBIOS
              </button>
              <button onClick={() => { setEditProduct(null); setEditForm(null); }} className="glass-bevel px-6 py-3.5 rounded-xl text-sm font-black text-engraved-light">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const posDir = path.join(__dirname, 'apps/web/app/pos');
fs.mkdirSync(posDir, { recursive: true });
fs.writeFileSync(path.join(posDir, 'page.tsx'), posPage, 'utf8');
console.log('POS page generated OK');
