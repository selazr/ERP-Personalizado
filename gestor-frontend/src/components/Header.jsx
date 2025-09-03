// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  CalendarClock,
  Users,
  TrendingUp,
  Building2,
  Menu,
  Bell,
  UserCheck
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isActivo = (trabajador) => {
    const today = new Date();
    const fechaAlta = new Date(trabajador.fecha_alta);
    const fechaBaja = trabajador.fecha_baja ? new Date(trabajador.fecha_baja) : null;
    return fechaAlta <= today && (!fechaBaja || fechaBaja >= today);
  };


  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/trabajadores`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="bg-gradient-to-r from-slate-800 via-slate-900 to-black shadow-lg sticky top-0 z-50 w-full"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img className="h-8 w-auto" alt="Logo" src="/logo.png" />
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <NavLink to="/dashboard" className={navLinkClasses}>
                  <CalendarClock className="mr-2 h-5 w-5" />
                  Gestor de Horarios
                </NavLink>
                <NavLink to="/trabajador" className={navLinkClasses}>
                  <Users className="mr-2 h-5 w-5" />
                  Gestionar Trabajadores
                </NavLink>
                <NavLink to="/proyecciones" className={navLinkClasses}>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Proyecciones
                </NavLink>
                <NavLink to="/organizacion" className={navLinkClasses}>
                  <Building2 className="mr-2 h-5 w-5" />
                  Organización
                </NavLink>
                <NavLink to="/externos" className={navLinkClasses}>
                  <UserCheck className="mr-2 h-5 w-5" />
                  Externos
                </NavLink>
              </div>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white relative focus:outline-none"
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
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white relative focus:outline-none"
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
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
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
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition w-full justify-center"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
