// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  CalendarClock,
  Users,
  TrendingUp,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleResize = () => setIsMobile(window.innerWidth < 768);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
              </div>
            </nav>
          </div>

          <div className="hidden md:block">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>

          <div className="md:hidden">
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
