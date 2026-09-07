'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { usePosStore } from '../../store/posStore';
import {
  ShoppingCart, X, Zap, Search,
  ArrowLeft, CheckCircle, Pencil,
  Eye, FileText, Scale,
} from 'lucide-react';
import Link from 'next/link';

function fmtVES(n: number, decimals = 2): string {
  const [intPart, decPart] = n.toFixed(decimals).split('.');
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + (decPart ?? '00');
}
function fmtUSD(n: number, decimals = 2): string {
  return '$' + n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function parseRateInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  if (digits.length <= 2) return parseFloat('0.' + digits.padStart(2, '0'));
  return parseFloat(digits.slice(0, -2) + '.' + digits.slice(-2));
}

interface Product {
  variantId: string; name: string; price: number; stock: number;
  category: string; unit?: string; brand?: string; code?: string; description?: string;
}

const WEIGHT_UNITS = ['Kg', 'Litro', 'Metro', 'gr', 'Lt'];
function isWeightBased(unit?: string) { return !!unit && WEIGHT_UNITS.includes(unit); }

export default function PosPage() {
  const { settings } = useAuth();
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalUSD, exchangeRate, setExchangeRate } = usePosStore();
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'CARD'|'TRANSFER'>('CASH');
  const [paymentCurrency, setPaymentCurrency] = useState<'USD'|'VES'>('USD');
  const [products, setProducts] = useState<Product[]>([]);
  const [rateEditing, setRateEditing] = useState(false);
  const [rateRaw, setRateRaw] = useState('');
  const [weightProduct, setWeightProduct] = useState<Product|null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [viewProduct, setViewProduct] = useState<Product|null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/inventory/products', { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.map((p: any) => ({ ...p, variantId: p.id, price: Number(p.priceUSD), unit: p.unit || 'Unidad' })));
    } catch {}
  };

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('/api/exchange/bcv', { cache: 'no-store' });
        const data = await res.json();
        if (data?.usd > 0) setExchangeRate(Number(data.usd));
      } catch {}
    };
    fetchRate();
    loadProducts();
  }, [setExchangeRate]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const subtotalUSD    = getTotalUSD();
  const ivaUSD         = settings.chargeIVA ? subtotalUSD * 0.16 : 0;
  const totalConIvaUSD = subtotalUSD + ivaUSD;
  const igtfUSD        = (settings.chargeIGTF && paymentMethod === 'CASH' && paymentCurrency === 'USD') ? totalConIvaUSD * 0.03 : 0;
  const grandTotalUSD  = totalConIvaUSD + igtfUSD;
  const grandTotalVES  = grandTotalUSD * exchangeRate;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            variantId: i.variantId, name: i.name, price: i.price, quantity: i.quantity,
            unit: products.find(p => p.variantId === i.variantId)?.unit || 'Unidad',
            code: products.find(p => p.variantId === i.variantId)?.code || '',
          })),
          paymentMethod, paymentCurrency, exchangeRate,
          subtotalUSD, taxUSD: ivaUSD, igtfUSD, totalUSD: grandTotalUSD, totalVES: grandTotalVES,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al procesar la venta');
      }
      const sale = await res.json();
      clearCart();
      setCompletedSale(sale);
      await loadProducts();
    } catch (err: any) { 
      alert(err.message || 'Error al procesar la venta. Intente nuevamente.'); 
    }
    finally { setCheckoutLoading(false); }
  };

  function applyRate() {
    const parsed = parseRateInput(rateRaw);
    if (parsed > 0) setExchangeRate(parsed);
    setRateEditing(false); setRateRaw('');
  }

  const inputClass = "w-full glass-icon rounded-xl px-4 py-3 text-sm text-zinc-200 font-bold placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden text-zinc-200">

      {/* LEFT: Catalogo */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="glass-bevel m-4 mb-2 px-4 py-3 flex flex-col sm:flex-row items-center gap-4 z-10">
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
            <Link href="/" className="glass-icon p-2 rounded-xl hover:bg-zinc-700/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500 drop-shadow-md" />
              <span className="font-black text-engraved-light tracking-wider uppercase">POS VENTECH</span>
            </div>
            <Link href="/sales" className="glass-icon px-3 py-1.5 rounded-xl text-xs font-black text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors ml-auto sm:ml-0">
              <FileText className="w-3.5 h-3.5" /> HISTORIAL
            </Link>
          </div>
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input className={inputClass + " pl-10"} placeholder="BUSCAR PRODUCTO O CODIGO..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="mx-4 mb-2 flex flex-wrap items-center gap-3 sm:gap-6 px-4 py-2.5 glass-bevel text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-engraved-light tracking-wider">TASA BCV:</span>
            {rateEditing ? (
              <form onSubmit={e => { e.preventDefault(); applyRate(); }} className="flex items-center gap-1.5">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">Bs.</span>
                  <input autoFocus type="text" inputMode="numeric"
                    value={rateRaw ? fmtVES(parseRateInput(rateRaw), 2) : ''}
                    onChange={e => setRateRaw(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => {
                      if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Enter' && e.key !== 'Escape') e.preventDefault();
                      if (e.key === 'Escape') { setRateEditing(false); setRateRaw(''); }
                    }}
                    placeholder="ej: 77534"
                    className="w-32 glass-icon rounded-lg pl-7 pr-2 py-1 text-sm text-cyan-400 font-black focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <button type="submit" className="text-emerald-400 hover:text-emerald-300 font-black text-xs px-2 py-1 glass-bevel rounded-lg">OK</button>
                <button type="button" onClick={() => { setRateEditing(false); setRateRaw(''); }} className="text-zinc-500 hover:text-red-400 font-black text-xs px-1">X</button>
              </form>
            ) : (
              <button onClick={() => setRateEditing(true)} className="flex items-center gap-1 group">
                <strong className="text-cyan-400 text-sm drop-shadow-md">Bs. {exchangeRate > 0 ? fmtVES(exchangeRate, 2) : 'Cargando...'}</strong>
                <Pencil className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400 transition-colors ml-1" />
              </button>
            )}
          </div>
          {settings.chargeIVA && <span className="text-engraved-light">IVA: <strong className="text-blue-400 ml-1">16%</strong></span>}
          {settings.chargeIGTF && <span className="text-engraved-light">IGTF: <strong className="text-amber-400 ml-1">3% (Divisas efectivo)</strong></span>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(product => (
              <div key={product.variantId} className="group flex flex-col glass-bevel">
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <span className="text-[9px] font-black text-engraved tracking-widest uppercase">{product.code}</span>
                  <button onClick={e => { e.stopPropagation(); setViewProduct(product); }}
                    className="w-6 h-6 glass-icon rounded-md flex items-center justify-center text-zinc-500 hover:text-cyan-400 transition-colors" title="Ver detalle">
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
                <button
                  disabled={product.stock === 0}
                  onClick={() => {
                    if (isWeightBased(product.unit)) { setWeightProduct(product); setWeightInput(''); }
                    else addItem({ variantId: product.variantId, name: product.name, price: product.price, quantity: 1 });
                  }}
                  className="flex flex-col items-start text-left p-3 pt-1 flex-1 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-full aspect-video glass-icon rounded-xl mb-3 flex items-center justify-center text-zinc-600 group-hover:text-blue-500 transition-colors">
                    {isWeightBased(product.unit) ? <Scale className="w-8 h-8 drop-shadow-lg" /> : <ShoppingCart className="w-8 h-8 drop-shadow-lg" />}
                  </div>
                  <p className="text-[9px] font-black text-engraved uppercase tracking-widest mb-1">{product.category}</p>
                  <h3 className="text-sm font-bold text-zinc-300 leading-snug mb-3 flex-1 w-full">{product.name}</h3>
                  <div className="flex items-end justify-between w-full">
                    <span className="text-lg font-black text-engraved-light">
                      {fmtUSD(product.price)}
                      <span className="text-[9px] text-zinc-500 ml-1">/{isWeightBased(product.unit) ? product.unit : '+IVA'}</span>
                    </span>
                    <span className={"text-[9px] font-black px-2 py-1 glass-icon rounded-md " + (product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-amber-400' : 'text-emerald-400')}>
                      {isWeightBased(product.unit) ? `${product.stock} ${product.unit}` : `STOCK: ${product.stock}`}
                    </span>
                  </div>
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-16 text-center text-zinc-600 font-bold">No se encontraron productos</div>}
          </div>
        </div>
      </div>

      {/* RIGHT: Carrito */}
      <div className="w-full lg:w-[420px] flex flex-col glass-bevel lg:m-4 lg:ml-0 mt-0 lg:mt-4 overflow-hidden rounded-t-3xl lg:rounded-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between glass-icon rounded-none shadow-sm">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <span className="font-black text-engraved-light uppercase tracking-widest text-sm">ORDEN ACTUAL</span>
          </div>
          {items.length > 0 && (
            <span className="text-[10px] font-black px-2 py-1 bg-blue-600/30 text-blue-300 rounded-full tracking-wider border border-blue-500/20">
              {items.length} {items.length === 1 ? 'ARTICULO' : 'ARTICULOS'}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <ShoppingCart className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-zinc-600 font-bold text-sm">Carrito vacio</p>
              <p className="text-zinc-700 text-xs mt-1">Selecciona un producto del catalogo</p>
            </div>
          )}
          {items.map(item => {
            const unit = products.find(p => p.variantId === item.variantId)?.unit || 'Unidad';
            const isW = isWeightBased(unit);
            const itemTotalUSD = item.price * item.quantity;
            const itemTotalVES = itemTotalUSD * exchangeRate;
            return (
              <div key={item.variantId} className="glass-icon rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-400">
                    {paymentCurrency === 'VES'
                      ? `Bs. ${fmtVES(item.price * exchangeRate)}/${isW ? unit : 'c/u'}`
                      : `${fmtUSD(item.price)}/${isW ? unit : 'c/u'}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isW ? (
                    <span className="text-sm font-black text-amber-400 px-2 py-1 glass-bevel rounded-lg min-w-[64px] text-center">
                      {Number(item.quantity).toFixed(3)} {unit}
                    </span>
                  ) : (
                    <>
                      <button onClick={() => item.quantity > 1 ? updateQuantity(item.variantId, item.quantity - 1) : removeItem(item.variantId)}
                        className="w-7 h-7 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-white text-lg leading-none">-</button>
                      <span className="text-sm font-black text-zinc-200 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-7 h-7 glass-bevel rounded-lg flex items-center justify-center text-zinc-400 hover:text-white text-lg leading-none">+</button>
                    </>
                  )}
                  <button onClick={() => removeItem(item.variantId)}
                    className="w-7 h-7 glass-bevel rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-sm font-black shrink-0 min-w-[80px] text-right">
                  {paymentCurrency === 'VES'
                    ? <span className="text-cyan-400">Bs. {fmtVES(itemTotalVES)}</span>
                    : <span className="text-blue-400">{fmtUSD(itemTotalUSD)}</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-4 pt-2 pb-2 border-t border-white/5">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <p className="text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5">METODO DE PAGO</p>
              <div className="flex gap-1">
                {(['CASH','CARD','TRANSFER'] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={"flex-1 py-2 rounded-xl text-[9px] font-black tracking-wider transition-all " + (paymentMethod === m ? 'bg-blue-600 text-white shadow-lg' : 'glass-icon text-zinc-400 hover:text-white')}>
                    {m === 'CASH' ? 'EFC' : m === 'CARD' ? 'TARJ' : 'TRANS'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-engraved uppercase tracking-widest mb-1.5">MONEDA</p>
              <div className="flex gap-1">
                {(['USD','VES'] as const).map(c => (
                  <button key={c} onClick={() => setPaymentCurrency(c)}
                    className={"px-3 py-2 rounded-xl text-[9px] font-black tracking-wider transition-all " + (paymentCurrency === c ? 'bg-emerald-700 text-white shadow-lg' : 'glass-icon text-zinc-400 hover:text-white')}>
                    {c === 'USD' ? 'us USD' : 'Bs VES'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-icon rounded-xl p-4 space-y-1 mb-3 text-xs font-bold">
            {paymentCurrency === 'VES' ? (
              <>
                <div className="flex justify-between text-zinc-400"><span>BASE IMPONIBLE:</span><span className="text-zinc-200">Bs. {fmtVES(subtotalUSD * exchangeRate)}</span></div>
                {settings.chargeIVA && <div className="flex justify-between text-blue-400"><span>IVA (16%):</span><span>Bs. {fmtVES(ivaUSD * exchangeRate)}</span></div>}
                {igtfUSD > 0 && <div className="flex justify-between text-amber-400"><span>IGTF (3% Divisas):</span><span>Bs. {fmtVES(igtfUSD * exchangeRate)}</span></div>}
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-white/10 mt-2">
                  <span>TOTAL Bs.:</span><span className="text-cyan-300">Bs. {fmtVES(grandTotalVES)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[10px] pt-1">
                  <span>TOTAL USD:</span><span>{fmtUSD(grandTotalUSD)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-zinc-400"><span>BASE IMPONIBLE:</span><span className="text-zinc-200">{fmtUSD(subtotalUSD)}</span></div>
                {settings.chargeIVA && <div className="flex justify-between text-blue-400"><span>IVA (16%):</span><span>{fmtUSD(ivaUSD)}</span></div>}
                {igtfUSD > 0 && <div className="flex justify-between text-amber-400"><span>IGTF (3% Divisas):</span><span>{fmtUSD(igtfUSD)}</span></div>}
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-white/10 mt-2">
                  <span>TOTAL USD:</span><span className="text-blue-300">{fmtUSD(grandTotalUSD)}</span>
                </div>
                <div className="flex justify-between text-cyan-400 text-[10px] pt-1">
                  <span>TOTAL Bs.:</span><span>Bs. {fmtVES(grandTotalVES)}</span>
                </div>
              </>
            )}
          </div>

          <button onClick={handleCheckout} disabled={items.length === 0 || checkoutLoading}
            className="w-full py-4 rounded-xl text-sm font-black text-white bg-gradient-to-br from-blue-600 to-blue-900 border border-blue-400/20 shadow-xl hover:from-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mb-4">
            {checkoutLoading ? <span className="animate-pulse">PROCESANDO...</span>
              : <><ShoppingCart className="w-5 h-5" /> COBRAR {paymentCurrency === 'VES' ? `Bs. ${fmtVES(grandTotalVES)}` : fmtUSD(grandTotalUSD)}</>}
          </button>
        </div>
      </div>

      {/* MODAL: Ver producto (solo lectura) */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-black text-engraved-light uppercase tracking-widest">Detalle</h2>
              </div>
              <button onClick={() => setViewProduct(null)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="glass-icon rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-engraved uppercase tracking-widest">{viewProduct.code}</p>
                  <p className="text-lg font-black text-zinc-200">{viewProduct.name}</p>
                  {viewProduct.brand && <p className="text-xs text-amber-400 font-bold uppercase">{viewProduct.brand}</p>}
                </div>
                <span className={"text-xs font-black px-2 py-1 rounded-full " + (viewProduct.stock === 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400')}>
                  {viewProduct.stock} {viewProduct.unit || 'und'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-engraved uppercase">Categoria</p><p className="font-bold text-zinc-300">{viewProduct.category}</p></div>
                <div><p className="text-engraved uppercase">Unidad</p><p className="font-bold text-zinc-300">{viewProduct.unit || 'Unidad'}</p></div>
                <div><p className="text-engraved uppercase">Precio</p><p className="font-black text-blue-400 text-base">{fmtUSD(viewProduct.price)}</p></div>
                {viewProduct.description && <div className="col-span-2"><p className="text-engraved uppercase">Descripcion</p><p className="font-bold text-zinc-300">{viewProduct.description}</p></div>}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                disabled={viewProduct.stock === 0}
                onClick={() => {
                  if (isWeightBased(viewProduct.unit)) { setWeightProduct(viewProduct); setWeightInput(''); }
                  else addItem({ variantId: viewProduct.variantId, name: viewProduct.name, price: viewProduct.price, quantity: 1 });
                  setViewProduct(null);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br from-blue-700 to-cyan-800 border border-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-40">
                <ShoppingCart className="w-4 h-4" /> AGREGAR
              </button>
              <button onClick={() => setViewProduct(null)} className="glass-bevel px-4 py-3 rounded-xl text-sm font-black text-engraved-light">CERRAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ingreso de peso */}
      {weightProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Scale className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-base font-black text-engraved-light uppercase tracking-widest">{weightProduct.name}</h2>
              <p className="text-xs text-zinc-500 font-bold mt-1">Precio: <span className="text-amber-400">{fmtUSD(weightProduct.price)}/{weightProduct.unit}</span></p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-engraved uppercase tracking-widest mb-2">
                Peso en {weightProduct.unit === 'Kg' ? 'Gramos (Ej: 1500 = 1.5 Kg)' : weightProduct.unit}
              </label>
              <input autoFocus type="text" inputMode="decimal" placeholder={weightProduct.unit === 'Kg' ? "Ej: 1500" : "Ej: 1.5"}
                value={weightInput} onChange={e => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                  setWeightInput(val);
                }}
                onKeyDown={e => {
                  const parsedStr = weightInput.replace(/,/g, '.');
                  let w = parseFloat(parsedStr);
                  if (weightProduct.unit === 'Kg') w = w / 1000;
                  if (e.key === 'Enter') { if (w > 0) { addItem({ variantId: weightProduct.variantId, name: weightProduct.name, price: weightProduct.price, quantity: w }); setWeightProduct(null); setWeightInput(''); } }
                  if (e.key === 'Escape') { setWeightProduct(null); setWeightInput(''); }
                }}
                className="w-full glass-icon rounded-xl px-4 py-3 text-xl text-amber-400 font-black text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            {parseFloat(weightInput.replace(/,/g, '.')) > 0 && (
              <div className="glass-icon rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-zinc-500 font-bold">
                  {weightProduct.unit === 'Kg' ? (parseFloat(weightInput.replace(/,/g, '.')) / 1000).toFixed(3) : parseFloat(weightInput.replace(/,/g, '.')).toFixed(3)} {weightProduct.unit} x {fmtUSD(weightProduct.price)}
                </p>
                <p className="text-2xl font-black text-emerald-400">
                  {fmtUSD((weightProduct.unit === 'Kg' ? parseFloat(weightInput.replace(/,/g, '.')) / 1000 : parseFloat(weightInput.replace(/,/g, '.'))) * weightProduct.price)}
                </p>
                {settings.chargeIVA && <p className="text-[10px] text-zinc-600 font-bold">+ IVA 16%</p>}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { 
                let w = parseFloat(weightInput.replace(/,/g, '.')); 
                if (weightProduct.unit === 'Kg') w = w / 1000;
                if (w > 0) { addItem({ variantId: weightProduct.variantId, name: weightProduct.name, price: weightProduct.price, quantity: w }); setWeightProduct(null); setWeightInput(''); } 
              }}
                disabled={!(parseFloat(weightInput.replace(/,/g, '.')) > 0)}
                className="flex-1 py-3.5 rounded-xl text-sm font-black text-white bg-gradient-to-br from-amber-600 to-orange-800 border border-amber-500/20 hover:from-amber-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                AGREGAR
              </button>
              <button onClick={() => { setWeightProduct(null); setWeightInput(''); }} className="glass-bevel px-5 py-3.5 rounded-xl text-sm font-black text-engraved-light">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Factura completada */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 font-mono">
            <div className="text-center border-b border-dashed border-zinc-600 pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-black text-white tracking-widest">VENTECH ERP</span>
              </div>
              <p className="text-xs text-zinc-400">FACTURA DE VENTA</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{completedSale.invoiceNumber}</p>
              <p className="text-xs text-zinc-400">{new Date(completedSale.createdAt).toLocaleString('es-VE')}</p>
            </div>
            <div className="space-y-1.5 border-b border-dashed border-zinc-600 pb-4">
              <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-500 font-bold mb-2 pb-1 border-b border-zinc-700">
                <div className="col-span-6">PRODUCTO</div>
                <div className="col-span-3 text-right">USD</div>
                <div className="col-span-3 text-right">Bs.</div>
              </div>
              {completedSale.items.map((item: any) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 text-xs items-center">
                  <div className="col-span-6 min-w-0">
                    <p className="text-zinc-200 font-bold truncate">{item.name}</p>
                    <p className="text-zinc-500 text-[10px]">{Number(item.quantity).toFixed(item.unit === 'Kg' ? 3 : 0)} {item.unit} x {fmtUSD(Number(item.priceUSD))}</p>
                  </div>
                  <div className="col-span-3 text-right text-zinc-300">
                    {fmtUSD(Number(item.subtotal))}
                  </div>
                  <div className="col-span-3 text-right text-zinc-300">
                    {fmtVES(Number(item.subtotal) * Number(completedSale.exchangeRate))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs border-b border-dashed border-zinc-600 pb-4">
              <div className="grid grid-cols-12 gap-2 text-right">
                <div className="col-span-6 text-left text-zinc-400">BASE IMPONIBLE</div>
                <div className="col-span-3 text-zinc-300">{fmtUSD(Number(completedSale.subtotalUSD))}</div>
                <div className="col-span-3 text-zinc-300">{fmtVES(Number(completedSale.subtotalUSD) * Number(completedSale.exchangeRate))}</div>
              </div>
              {settings.chargeIVA && (
                <div className="grid grid-cols-12 gap-2 text-right">
                  <div className="col-span-6 text-left text-blue-400">IVA (16%)</div>
                  <div className="col-span-3 text-blue-400">{fmtUSD(Number(completedSale.taxUSD))}</div>
                  <div className="col-span-3 text-blue-400">{fmtVES(Number(completedSale.taxUSD) * Number(completedSale.exchangeRate))}</div>
                </div>
              )}
              {Number(completedSale.igtfUSD) > 0 && (
                <div className="grid grid-cols-12 gap-2 text-right">
                  <div className="col-span-6 text-left text-amber-400">IGTF (3%)</div>
                  <div className="col-span-3 text-amber-400">{fmtUSD(Number(completedSale.igtfUSD))}</div>
                  <div className="col-span-3 text-amber-400">{fmtVES(Number(completedSale.igtfUSD) * Number(completedSale.exchangeRate))}</div>
                </div>
              )}
              <div className="grid grid-cols-12 gap-2 text-right pt-2 border-t border-zinc-600 font-black text-sm mt-1">
                <div className="col-span-6 text-left text-white">TOTAL</div>
                <div className="col-span-3 text-white">{fmtUSD(Number(completedSale.totalUSD))}</div>
                <div className="col-span-3 text-cyan-400">{fmtVES(Number(completedSale.totalVES))}</div>
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>METODO DE PAGO</span>
                <span className="text-zinc-200 font-bold">
                  {({CASH:'EFECTIVO', CARD:'TARJETA/PUNTO', TRANSFER:'PAGO MOVIL'})[completedSale.paymentMethod as string] || completedSale.paymentMethod}
                  {' — '}{completedSale.paymentCurrency}
                </span>
              </div>
            </div>
            <div className="text-center text-[10px] text-zinc-600 border-t border-dashed border-zinc-600 pt-3 space-y-0.5">
              {settings.chargeIVA && (
                <>
                  <p>SUJETO AL IVA - RIF: J-00000000-0</p>
                  <p>Conforme a la Ley del IVA y normativa SENIAT</p>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-blue-700 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> IMPRIMIR
              </button>
              <button onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 rounded-xl text-sm font-black text-zinc-300 bg-zinc-800 border border-zinc-700">
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
