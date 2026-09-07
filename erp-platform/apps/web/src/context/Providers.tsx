'use client';
import { UserProvider } from '@/context/UserContext';
import { ReactNode, useEffect, useState } from 'react';

function LicenseGuard({ children }: { children: ReactNode }) {
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/license', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.expiresAt) {
          const exp = new Date(d.expiresAt);
          if (new Date() > exp) {
            setExpired(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full"></div></div>;

  if (expired) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-red-500 mb-2 uppercase tracking-widest">Licencia Expirada</h1>
        <p className="text-zinc-400 max-w-md">El periodo de uso autorizado de VENTECH ERP ha finalizado. Por favor, contacte a su proveedor de software para renovar la licencia o adquirir el sistema definitivo.</p>
        <div className="mt-8 px-6 py-3 border border-red-500/30 bg-red-500/10 rounded-xl">
          <p className="text-xs font-bold text-red-400">Error: LIC_EXP_01</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <LicenseGuard>
        {children}
      </LicenseGuard>
    </UserProvider>
  );
}
