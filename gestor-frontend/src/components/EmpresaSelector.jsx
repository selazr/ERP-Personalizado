import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Palette,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEmpresa } from '@/context/EmpresaContext';

const THEME_OPTIONS = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Violeta eléctrico con aura nocturna.',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(34,197,94,0.75))'
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    description: 'Azules profundos con brillo frío.',
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.85), rgba(37,99,235,0.8))'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Verde premium con contraste suave.',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.85), rgba(34,197,94,0.8))'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Naranjas cálidos con toque cobrizo.',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.9), rgba(244,63,94,0.8))'
  }
];

const readThemeMap = () => {
  try {
    return JSON.parse(localStorage.getItem('empresaThemeMap') || '{}');
  } catch (error) {
    console.warn('No se pudo cargar el mapa de temas:', error);
    return {};
  }
};

const pickDefaultTheme = (empresa) => {
  if (!empresa) return THEME_OPTIONS[0].id;
  const base = `${empresa.id ?? ''}${empresa.nombre ?? ''}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash + base.charCodeAt(i) * (i + 1)) % 997;
  }
  return THEME_OPTIONS[hash % THEME_OPTIONS.length].id;
};

export default function EmpresaSelector() {
  const navigate = useNavigate();
  const {
    empresaId,
    empresas,
    loadingEmpresas,
    setEmpresa,
    refreshEmpresas,
    themeName,
    setEmpresaTheme
  } = useEmpresa();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('empresaFavs') || '[]'));
    } catch (error) {
      console.warn('No se pudieron cargar favoritas:', error);
      return new Set();
    }
  });
  const [themeMap, setThemeMap] = useState(() => readThemeMap());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    refreshEmpresas();
  }, [refreshEmpresas]);

  useEffect(() => {
    if (empresaId) {
      navigate('/dashboard');
    }
  }, [empresaId, navigate]);

  useEffect(() => {
    if (!selectedId && empresas.length > 0) {
      setSelectedId(String(empresaId || empresas[0].id));
    }
  }, [empresaId, empresas, selectedId]);

  useEffect(() => {
    localStorage.setItem('empresaFavs', JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    setThemeMap(readThemeMap());
  }, [themeName, empresas]);

  const filteredEmpresas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return empresas.filter((empresa) => {
      const matchesSearch = !q || empresa.nombre?.toLowerCase().includes(q) || String(empresa.id).includes(q);
      const matchesFav = !onlyFav || favorites.has(String(empresa.id));
      return matchesSearch && matchesFav;
    });
  }, [empresas, favorites, onlyFav, query]);

  const selectedEmpresa = useMemo(() => (
    filteredEmpresas.find((empresa) => String(empresa.id) === selectedId)
    || empresas.find((empresa) => String(empresa.id) === selectedId)
    || null
  ), [empresas, filteredEmpresas, selectedId]);

  const selectedThemeId = selectedEmpresa
    ? themeMap[selectedEmpresa.id] || pickDefaultTheme(selectedEmpresa)
    : themeName;

  const handleConfirm = () => {
    if (!selectedEmpresa) return;
    setEmpresa(selectedEmpresa);
    navigate('/dashboard');
  };

  const handleThemeChange = (themeId) => {
    if (!selectedEmpresa) return;
    const nextMap = { ...themeMap, [selectedEmpresa.id]: themeId };
    setThemeMap(nextMap);
    setEmpresaTheme(selectedEmpresa.id, themeId);
  };

  const stats = useMemo(() => ({
    total: empresas.length,
    favoritas: favorites.size,
    filtradas: filteredEmpresas.length
  }), [empresas.length, favorites.size, filteredEmpresas.length]);

  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{ background: 'var(--theme-bg)' }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-6 rounded-3xl border p-6 shadow-2xl"
          style={{
            background: 'linear-gradient(120deg, rgba(15,23,42,0.7), rgba(2,6,23,0.85))',
            borderColor: 'var(--theme-card-border)',
            boxShadow: 'var(--theme-shadow)'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="grid h-14 w-14 place-items-center rounded-2xl"
                style={{
                  background: 'var(--theme-accent-soft)',
                  color: 'var(--theme-accent)'
                }}
              >
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                  ERP Company Hub
                </p>
                <h1 className="text-2xl font-semibold text-white">
                  Selecciona empresa y personaliza tu experiencia
                </h1>
                <p className="text-sm text-slate-300">
                  Cambia de tenant, revisa el estado y ajusta el tema visual por empresa.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-chip)' }}>
                <ShieldCheck className="h-4 w-4" />
                SSO activo
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-chip)' }}>
                <Sparkles className="h-4 w-4" />
                Tema: {THEME_OPTIONS.find((theme) => theme.id === themeName)?.name || themeName}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_repeat(3,1fr)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar empresa, ID o keyword…"
                className="w-full rounded-2xl border bg-slate-900/60 px-10 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--theme-card-border)', boxShadow: '0 0 0 1px var(--theme-ring)' }}
              />
            </div>
            <div
              className="flex flex-col justify-center gap-1 rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-card)' }}
            >
              <span className="text-xs uppercase text-slate-400">Empresas</span>
              <span className="text-lg font-semibold text-white">{stats.total}</span>
            </div>
            <div
              className="flex flex-col justify-center gap-1 rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-card)' }}
            >
              <span className="text-xs uppercase text-slate-400">Favoritas</span>
              <span className="text-lg font-semibold text-white">{stats.favoritas}</span>
            </div>
            <div
              className="flex flex-col justify-center gap-1 rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-card)' }}
            >
              <span className="text-xs uppercase text-slate-400">Visibles</span>
              <span className="text-lg font-semibold text-white">{stats.filtradas}</span>
            </div>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Empresas disponibles</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOnlyFav((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition"
                  style={{
                    borderColor: 'var(--theme-card-border)',
                    background: onlyFav ? 'var(--theme-accent-soft)' : 'var(--theme-chip)'
                  }}
                >
                  <Star className="h-4 w-4" />
                  {onlyFav ? 'Favoritas' : 'Todas'}
                </button>
                <button
                  type="button"
                  onClick={refreshEmpresas}
                  disabled={loadingEmpresas}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition"
                  style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-chip)' }}
                >
                  <RefreshCcw className={`h-4 w-4 ${loadingEmpresas ? 'animate-spin' : ''}`} />
                  {loadingEmpresas ? 'Actualizando' : 'Actualizar'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {filteredEmpresas.map((empresa) => {
                  const isSelected = String(empresa.id) === selectedId;
                  const isFav = favorites.has(String(empresa.id));
                  return (
                    <motion.button
                      key={empresa.id}
                      layout
                      type="button"
                      onClick={() => setSelectedId(String(empresa.id))}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="group w-full rounded-2xl border px-5 py-4 text-left transition"
                      style={{
                        borderColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                        background: isSelected ? 'var(--theme-accent-soft)' : 'var(--theme-card)'
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                            ID {empresa.id}
                          </p>
                          <p className="text-lg font-semibold text-white">{empresa.nombre}</p>
                          <p className="text-xs text-slate-400">Tenant listo para operar.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                            style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-chip)' }}
                          >
                            <BadgeCheck className="h-4 w-4" />
                            Operativa
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setFavorites((prev) => {
                                const next = new Set(prev);
                                const key = String(empresa.id);
                                if (next.has(key)) {
                                  next.delete(key);
                                } else {
                                  next.add(key);
                                }
                                return next;
                              });
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-white transition"
                            style={{
                              borderColor: 'var(--theme-card-border)',
                              background: isFav ? 'var(--theme-accent-soft)' : 'transparent'
                            }}
                            aria-label="Marcar favorita"
                          >
                            <Star className={`h-4 w-4 ${isFav ? '' : 'opacity-60'}`} />
                          </button>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
              {filteredEmpresas.length === 0 && (
                <div
                  className="rounded-2xl border px-6 py-8 text-center text-sm text-slate-300"
                  style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-card)' }}
                >
                  No hay empresas que coincidan con los filtros actuales.
                </div>
              )}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="sticky top-8 flex flex-col gap-4"
          >
            <div
              className="rounded-3xl border p-6"
              style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-card)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Empresa seleccionada</p>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedEmpresa?.nombre || 'Sin selección'}
                  </h3>
                  {selectedEmpresa && (
                    <p className="text-sm text-slate-300">ID {selectedEmpresa.id}</p>
                  )}
                </div>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-chip)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  Tema {THEME_OPTIONS.find((theme) => theme.id === selectedThemeId)?.name || selectedThemeId}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Acceso seguro con permisos personalizados.
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Datos sincronizados y listos para operar.
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Tema visual adaptado al tenant.
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedEmpresa}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: 'var(--theme-accent)',
                  boxShadow: '0 10px 30px rgba(15,23,42,0.35)'
                }}
              >
                Continuar al dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div
              className="rounded-3xl border p-6"
              style={{ borderColor: 'var(--theme-card-border)', background: 'var(--theme-card)' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tema por empresa</p>
                  <h3 className="text-lg font-semibold text-white">Ajusta la estética del tenant</h3>
                </div>
                <Palette className="h-5 w-5 text-slate-300" />
              </div>

              <div className="grid gap-3">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeChange(theme.id)}
                    disabled={!selectedEmpresa}
                    className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: theme.id === selectedThemeId ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                      background: theme.id === selectedThemeId ? 'var(--theme-accent-soft)' : 'rgba(15,23,42,0.4)'
                    }}
                  >
                    <span
                      className="h-10 w-10 rounded-xl"
                      style={{ background: theme.gradient }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{theme.name}</p>
                      <p className="text-xs text-slate-400">{theme.description}</p>
                    </div>
                    {theme.id === selectedThemeId && (
                      <span className="text-xs font-semibold text-white">Activo</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
