// src/components/Header.jsx
import { Fragment, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  CalendarClock,
  Users,
  TrendingUp,
  Building2,
  Menu,
  Bell,
  UserCheck,
  Palette,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '@/utils/api';
import apiClient from '@/utils/apiClient';
import { useEmpresa } from '@/context/EmpresaContext';

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { empresaId, empresaNombre, empresas, setEmpresa, themeName, setEmpresaTheme } = useEmpresa();

  const isActivo = (trabajador) => {
    const today = new Date();
    const fechaAlta = new Date(trabajador.fecha_alta);
    const fechaBaja = trabajador.fecha_baja ? new Date(trabajador.fecha_baja) : null;
    return fechaAlta <= today && (!fechaBaja || fechaBaja >= today);
  };


  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get(apiUrl('trabajadores'));
        const today = new Date();
        const upcoming = [];
        res.data.filter(isActivo).forEach((w) => {
          if (w.fecha_baja) {
            const diff = (new Date(w.fecha_baja) - today) / (1000 * 60 * 60 * 24);
            if (diff >= 0 && diff <= 7) {
              const dias = Math.ceil(diff);
              const mensaje = dias === 7
                ? `A ${w.nombre} le queda 1 semana de contrato`
                : dias === 1
                  ? `A ${w.nombre} le queda 1 día de contrato`
                  : `A ${w.nombre} le quedan ${dias} días de contrato`;
              upcoming.push({ id: `baja-${w.id}`, mensaje });
            }
          }
          if (w.fechafin_limosa) {
            const diff = (new Date(w.fechafin_limosa) - today) / (1000 * 60 * 60 * 24);
            if (diff >= 0 && diff <= 7) {
              const dias = Math.ceil(diff);
              const mensaje = dias === 7
                ? `La Limosa de ${w.nombre} vence en 1 semana`
                : dias === 1
                  ? `La Limosa de ${w.nombre} vence en 1 día`
                  : `La Limosa de ${w.nombre} vence en ${dias} días`;
              upcoming.push({ id: `limosa-${w.id}`, mensaje });
            }
          }
          if (w.fechafin_a1) {
            const diff = (new Date(w.fechafin_a1) - today) / (1000 * 60 * 60 * 24);
            if (diff >= 0 && diff <= 7) {
              const dias = Math.ceil(diff);
              const mensaje = dias === 7
                ? `El A1 de ${w.nombre} vence en 1 semana`
                : dias === 1
                  ? `El A1 de ${w.nombre} vence en 1 día`
                  : `El A1 de ${w.nombre} vence en ${dias} días`;
              upcoming.push({ id: `a1-${w.id}`, mensaje });
            }
          }
        });
        setNotifications(upcoming);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [empresaId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setEmpresa(null);
    navigate('/');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors duration-150 ease-in-out ${
      isActive
        ? 'bg-[var(--theme-accent-soft)] text-white shadow-md'
        : 'text-slate-200 hover:bg-[var(--theme-chip)] hover:text-white'
    }`;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b shadow-lg backdrop-blur-xl"
      style={{ background: 'var(--theme-header)', borderColor: 'var(--theme-card-border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: 'var(--theme-accent-soft)', color: 'var(--theme-accent)' }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <img className="h-7 w-auto" alt="Logo" src="/logo.png" />
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <NavLink to="/dashboard" className={navLinkClasses}>
                  <CalendarClock className="h-4 w-4" />
                  <span className="hidden lg:inline">Horarios</span>
                </NavLink>
                <NavLink to="/trabajador" className={navLinkClasses}>
                  <Users className="h-4 w-4" />
                  <span className="hidden lg:inline">Trabajadores</span>
                </NavLink>
                <NavLink to="/proyecciones" className={navLinkClasses}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden lg:inline">Proyecciones</span>
                </NavLink>
                <NavLink to="/organizacion" className={navLinkClasses}>
                  <Building2 className="h-4 w-4" />
                  <span className="hidden lg:inline">Organización</span>
                </NavLink>
                <NavLink to="/externos" className={navLinkClasses}>
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden lg:inline">Externos</span>
                </NavLink>
              </div>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <HeadlessMenu as="div" className="relative">
              <HeadlessMenu.Button className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-slate-900/80">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden xl:inline">Ajustes</span>
                <ChevronDown className="h-4 w-4 text-slate-300" />
              </HeadlessMenu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-2 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-2 scale-95"
              >
                <HeadlessMenu.Items className="absolute right-0 mt-3 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-3 shadow-xl focus:outline-none">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Empresa activa
                  </div>
                  <div className="mt-2">
                    <select
                      value={empresaId}
                      onChange={(event) => {
                        const next = empresas.find((e) => String(e.id) === event.target.value);
                        if (next) {
                          setEmpresa(next);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-[var(--theme-ring)]"
                    >
                      <option value={empresaId}>{empresaNombre || 'Selecciona empresa'}</option>
                      {empresas
                        .filter((e) => String(e.id) !== String(empresaId))
                        .map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tema visual
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-slate-400" />
                    <select
                      value={themeName}
                      onChange={(event) => {
                        if (empresaId) {
                          setEmpresaTheme(empresaId, event.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-[var(--theme-ring)]"
                    >
                      <option value="aurora">Aurora</option>
                      <option value="sapphire">Sapphire</option>
                      <option value="emerald">Emerald</option>
                      <option value="sunset">Sunset</option>
                    </select>
                  </div>
                </HeadlessMenu.Items>
              </Transition>
            </HeadlessMenu>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full border border-white/10 bg-slate-900/60 p-2 text-white shadow-sm transition hover:bg-slate-900/80 focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded shadow-lg z-50"
                  >
                    {notifications.length === 0 && (
                      <div className="px-4 py-2 text-sm">Sin notificaciones</div>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className="px-4 py-2 text-sm border-b last:border-b-0">
                        {n.mensaje}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full bg-red-600/90 p-2 text-white shadow-sm transition hover:bg-red-600"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white focus:outline-none"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full border border-white/10 bg-slate-900/60 p-2 text-white shadow-sm transition hover:bg-slate-900/80 focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded shadow-lg z-50"
                  >
                    {notifications.length === 0 && (
                      <div className="px-4 py-2 text-sm">Sin notificaciones</div>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className="px-4 py-2 text-sm border-b last:border-b-0">
                        {n.mensaje}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-slate-800"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <div className="px-2 py-2">
                <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Empresa activa
                </label>
                <select
                  value={empresaId}
                  onChange={(event) => {
                    const next = empresas.find((e) => String(e.id) === event.target.value);
                    if (next) {
                      setEmpresa(next);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={empresaId}>{empresaNombre || 'Selecciona empresa'}</option>
                  {empresas
                    .filter((e) => String(e.id) !== String(empresaId))
                    .map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                </select>
              </div>
              <div className="px-2 py-2">
                <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Tema visual
                </label>
                <select
                  value={themeName}
                  onChange={(event) => {
                    if (empresaId) {
                      setEmpresaTheme(empresaId, event.target.value);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aurora">Aurora</option>
                  <option value="sapphire">Sapphire</option>
                  <option value="emerald">Emerald</option>
                  <option value="sunset">Sunset</option>
                </select>
              </div>
              <NavLink to="/dashboard" className={navLinkClasses}>
                <CalendarClock className="mr-2 h-5 w-5" /> Horarios
              </NavLink>
              <NavLink to="/trabajador" className={navLinkClasses}>
                <Users className="mr-2 h-5 w-5" /> Trabajadores
              </NavLink>
              <NavLink to="/proyecciones" className={navLinkClasses}>
                <TrendingUp className="mr-2 h-5 w-5" /> Proyecciones
              </NavLink>
              <NavLink to="/organizacion" className={navLinkClasses}>
                <Building2 className="mr-2 h-5 w-5" /> Organización
              </NavLink>
              <NavLink to="/externos" className={navLinkClasses}>
                <UserCheck className="mr-2 h-5 w-5" /> Externos
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 w-full justify-center"
              >
                <LogOut className="h-5 w-5" />
                Salir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
