'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Users, Plus, Edit2, Trash2, ArrowLeft, Shield, CheckCircle, XCircle, Eye, EyeOff, Key } from 'lucide-react';
import Link from 'next/link';

type Role = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'CASHIER' | 'INVENTORY';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  birthDate?: string;
}

const roleConfig: Record<Role, { label: string; color: string; desc: string }> = {
  SUPERADMIN: { label: 'Super Administrador', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', desc: 'Acceso total al sistema' },
  ADMIN:      { label: 'Administrador',        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',   desc: 'Gestión general del negocio' },
  MANAGER:    { label: 'Gerente',              color: 'text-violet-400 bg-violet-400/10 border-violet-400/30', desc: 'Supervisión de operaciones' },
  AUDITOR:    { label: 'Auditor',              color: 'text-red-400 bg-red-400/10 border-red-400/30',       desc: 'Auditoría y ciberseguridad' },
  CASHIER:    { label: 'Cajero / POS',         color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', desc: 'Punto de venta únicamente' },
  INVENTORY:  { label: 'Almacén / Inventario', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',   desc: 'Control de stock y productos' },
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPERADMIN: ['Todas las funciones del sistema', 'Gestión de usuarios y roles', 'Configuración de impuestos', 'Auditoría completa', 'Informes financieros'],
  ADMIN:      ['Panel de control principal', 'Punto de venta', 'Gestión de clientes', 'Inventario', 'Informes', 'Multimoneda'],
  MANAGER:    ['Punto de venta', 'Gestión de clientes', 'Inventario', 'Informes básicos'],
  AUDITOR:    ['Auditoría y seguridad', 'Informes financieros', 'Panel analítico (solo lectura)'],
  CASHIER:    ['Punto de venta (POS)', 'Ver historial de sus ventas'],
  INVENTORY:  ['Gestión de inventario', 'Agregar/editar productos', 'Control de stock'],
};

const initialUsers: SystemUser[] = [
  { id: '1', name: 'Dueño del Sistema', email: 'V-11111111', role: 'SUPERADMIN', isActive: true, createdAt: '2026-01-01', birthDate: '1980-01-01' },
  { id: '2', name: 'Administrador General', email: 'V-22222222', role: 'ADMIN', isActive: true, createdAt: '2026-01-15', birthDate: '1985-05-15' },
  { id: '3', name: 'Cajero Principal', email: 'V-44444444', role: 'CASHIER', isActive: true, createdAt: '2026-02-01', birthDate: '1990-10-20' },
  { id: '4', name: 'Almacenista', email: 'V-55555555', role: 'INVENTORY', isActive: true, createdAt: '2026-02-10', birthDate: '1995-12-12' },
];

type ModalMode = 'create' | 'edit' | 'permissions' | null;

interface UserForm {
  name: string;
  email: string;
  role: Role;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: UserForm = { name: '', email: '', role: 'CASHIER', birthDate: '', password: '', confirmPassword: '' };

export default function UsersPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        // Formatear fechas para el UI
        setUsers(data.map(u => ({
          ...u,
          createdAt: u.createdAt ? u.createdAt.split('T')[0] : '2026-01-01',
          birthDate: u.birthDate ? u.birthDate.split('T')[0] : ''
        })));
      }
    });
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const pwd = form.password;
  const specialMatch = pwd.match(/[!"#%&/(),.\-_*+@$]/g) || [];
  const letterMatch = pwd.match(/[a-zA-Z]/g) || [];
  const numMatch = pwd.match(/[0-9]/g) || [];
  const upperMatch = pwd.match(/[A-Z]/g) || [];
  const hasForbidden = /[^a-zA-Z0-9!"#%&/(),.\-_*+@$]/.test(pwd);

  const pwdRules = [
    { label: '4 a 7 letras', valid: letterMatch.length >= 4 && letterMatch.length <= 7 },
    { label: 'Al menos 1 mayúscula', valid: upperMatch.length >= 1 },
    { label: '4 a 6 números', valid: numMatch.length >= 4 && numMatch.length <= 6 },
    { label: '2 especiales (!"#%&/(),.-_*+@$)', valid: specialMatch.length >= 2 && !hasForbidden }
  ];

  if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-bevel p-12 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-zinc-400 mb-6">No tienes permisos para gestionar usuarios.</p>
          <Link href="/" className="px-6 py-2 bg-blue-600 rounded-xl text-white font-medium">Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (u: SystemUser) => {
    setSelectedUser(u);
    // Normalizar email: si no tiene V- adelante, agregarlo para el form
    const emailVal = u.email.startsWith('V-') ? u.email : `V-${u.email}`;
    setForm({ name: u.name, email: emailVal, role: u.role, birthDate: u.birthDate || '', password: '', confirmPassword: '' });
    setError('');
    setModal('edit');
  };
  const openPermissions = (u: SystemUser) => { setSelectedUser(u); setModal('permissions'); };
  const closeModal = () => { setModal(null); setSelectedUser(null); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Nombre y cédula son obligatorios.'); return; }
    if (modal === 'create' && !form.birthDate.trim()) { setError('La fecha de nacimiento es obligatoria.'); return; }
    
    if (!/^V-\d+$/.test(form.email.trim())) {
      setError('La Cédula debe tener el formato "V-12345678" (V- seguido de números).');
      return;
    }

    if (modal === 'create' && !form.password) { setError('La contraseña es obligatoria.'); return; }
    
    if (form.password) {
      if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
      
      const pwdVal = form.password;
      const specMatch = pwdVal.match(/[!"#%&/(),.\-_*+@$]/g);
      const letMatch = pwdVal.match(/[a-zA-Z]/g);
      const numMatch2 = pwdVal.match(/[0-9]/g);
      const upMatch = pwdVal.match(/[A-Z]/g);
      const hasForbid = /[^a-zA-Z0-9!"#%&/(),.\-_*+@$]/.test(pwdVal);
      
      if (hasForbid) { setError('La contraseña contiene caracteres no permitidos.'); return; }
      if (!specMatch || specMatch.length < 2) { setError('La contraseña debe tener al menos 2 caracteres especiales permitidos.'); return; }
      if (!letMatch || letMatch.length < 4 || letMatch.length > 7) { setError('La contraseña debe tener entre 4 y 7 letras.'); return; }
      if (!numMatch2 || numMatch2.length < 4 || numMatch2.length > 6) { setError('La contraseña debe tener entre 4 y 6 números.'); return; }
      if (!upMatch || upMatch.length < 1) { setError('La contraseña debe tener al menos 1 letra mayúscula.'); return; }
    }

    setIsSaving(true);

    try {
      if (modal === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
        });
        if (!res.ok) { setError('Error al crear usuario.'); setIsSaving(false); return; }
        const created = await res.json();
        setUsers(prev => [...prev, { ...created, createdAt: created.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0], birthDate: '' }]);
      } else if (modal === 'edit' && selectedUser) {
        const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { setError('Error al actualizar usuario.'); setIsSaving(false); return; }
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, name: form.name, email: form.email, role: form.role } : u));
        
        // Si el usuario se está editando a sí mismo, actualizamos la sesión actual para que el Header cambie de inmediato
        if (user && selectedUser.id === user.id) {
          login({ ...user, name: form.name, email: form.email, role: form.role as any });
        }
      }
      closeModal();
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = (id: string) => {
    if (users.find(u => u.id === id)?.role === 'SUPERADMIN') return;
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const deleteUser = (id: string) => {
    if (users.find(u => u.id === id)?.role === 'SUPERADMIN') return;
    if (confirm('¿Eliminar este usuario permanentemente?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1.5";

  return (
    <div className="min-h-screen text-zinc-200">
      {/* Header */}
      <div className="sticky top-0 z-40 p-4 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-9 h-9 glass-icon rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Gestión de Usuarios y Roles</h1>
              <p className="text-xs text-zinc-500">{users.filter(u => u.isActive).length} usuarios activos · {users.length} total</p>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all">
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Role Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][]).map(([role, cfg]) => (
            <div key={role} className={`glass-bevel rounded-xl p-3 border ${cfg.color.split(' ')[2]}`}>
              <p className={`text-xs font-bold mb-1 ${cfg.color.split(' ')[0]}`}>{cfg.label}</p>
              <p className="text-[10px] text-zinc-500">{cfg.desc}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="glass-bevel rounded-xl p-1.5">
          <input
            className="w-full bg-transparent px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="glass-bevel rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-black/40">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Miembro Desde</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const cfg = roleConfig[u.role];
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${cfg.color.split(' ')[2]} ${cfg.color.split(' ')[1]}`}>
                          <span className={cfg.color.split(' ')[0]}>{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'SUPERADMIN' ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-400" /><span className="text-xs text-amber-400 font-semibold">Inamovible</span>
                        </div>
                      ) : (
                        <button onClick={() => toggleActive(u.id)} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
                          {u.isActive
                            ? <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-400 font-semibold">Activo</span></>
                            : <><XCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400 font-semibold">Inactivo</span></>
                          }
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{u.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openPermissions(u)} title="Ver permisos" className="w-8 h-8 glass-icon rounded-lg flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors">
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        { (u.role !== 'SUPERADMIN' || user?.role === 'SUPERADMIN') && (
                          <button onClick={() => openEdit(u)} title="Editar" className="w-8 h-8 glass-icon rounded-lg flex items-center justify-center text-zinc-400 hover:text-blue-400 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {u.role !== 'SUPERADMIN' && (
                          <button onClick={() => deleteUser(u.id)} title="Eliminar" className="w-8 h-8 glass-icon rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-zinc-500">No se encontraron usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create/Edit User */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}
              <div>
                <label className={labelClass}>Nombre Completo *</label>
                <input className={inputClass} placeholder="Ej: Juan Pérez" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Cédula (Usuario) *</label>
                <div className="flex">
                  <span className="flex items-center justify-center bg-black/60 border border-white/10 border-r-0 rounded-l-xl px-4 text-zinc-400 font-bold text-sm">V-</span>
                  <input className={inputClass + " rounded-l-none pl-3"} type="text" placeholder="12345678" value={form.email.replace('V-', '')} onChange={e => setForm({...form, email: 'V-' + e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Fecha de Nacimiento *</label>
                <input className={inputClass} type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Rol en el Sistema *</label>
                <select className={inputClass} value={form.role} onChange={e => setForm({...form, role: e.target.value as Role})}>
                  {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][]).map(([r, cfg]) => (
                    <option key={r} value={r} disabled={r === 'SUPERADMIN' && user.role !== 'SUPERADMIN'}>{cfg.label}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-1">{roleConfig[form.role].desc}</p>
              </div>
              <div>
                <label className={labelClass}>{modal === 'create' ? 'Contraseña *' : 'Nueva Contraseña (dejar vacío para no cambiar)'}</label>
                <div className="relative">
                  <input className={inputClass + ' pr-10'} type={showPassword ? 'text' : 'password'} placeholder="Ej: Ventech!*1234" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {(modal === 'create' || form.password) && (
                  <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-zinc-500 mb-1 leading-tight">Caracteres especiales permitidos:<br/>( ! " # % & / ( ) , . - _ * - + @ $ )</p>
                    {pwdRules.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                        {r.valid ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />}
                        <span className={r.valid ? 'text-emerald-500' : 'text-zinc-500'}>{r.label}</span>
                      </div>
                    ))}
                    {hasForbidden && <div className="text-[10px] font-bold text-red-500 mt-2 uppercase">⚠️ Contiene caracteres no permitidos</div>}
                  </div>
                )}
              </div>
              {form.password && (
                <div>
                  <label className={labelClass}>Confirmar Contraseña *</label>
                  <div className="relative">
                    <input className={inputClass + ' pr-10'} type={showConfirmPassword ? 'text' : 'password'} placeholder="Repite la contraseña" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                {modal === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
              <button onClick={closeModal} disabled={isSaving} className="px-6 py-3 glass-icon rounded-xl text-zinc-400 hover:text-white disabled:opacity-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Permissions */}
      {modal === 'permissions' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-bevel rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Permisos del Usuario</h2>
                <p className="text-sm text-zinc-400">{selectedUser.name}</p>
              </div>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
            </div>
            <div className="p-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border mb-4 ${roleConfig[selectedUser.role].color}`}>
                <Shield className="w-4 h-4" />
                {roleConfig[selectedUser.role].label}
              </div>
              <ul className="space-y-2">
                {ROLE_PERMISSIONS[selectedUser.role].map((perm, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 pt-0">
              <button onClick={closeModal} className="w-full py-3 glass-icon rounded-xl text-zinc-400 hover:text-white transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
