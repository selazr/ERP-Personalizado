import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '@/utils/apiClient';
import { apiUrl } from '@/utils/api';

const EmpresaContext = createContext(null);

const STORAGE_ID = 'empresaId';
const STORAGE_NAME = 'empresaNombre';
const STORAGE_THEME = 'empresaTheme';
const STORAGE_THEME_MAP = 'empresaThemeMap';
const THEME_KEYS = ['aurora', 'sapphire', 'emerald', 'sunset'];

const loadThemeMap = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_THEME_MAP) || '{}');
  } catch (error) {
    console.warn('No se pudo leer el mapa de temas:', error);
    return {};
  }
};

const pickThemeForEmpresa = (empresa) => {
  if (!empresa) return THEME_KEYS[0];
  const base = `${empresa.id ?? ''}${empresa.nombre ?? ''}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash + base.charCodeAt(i) * (i + 1)) % 997;
  }
  return THEME_KEYS[hash % THEME_KEYS.length];
};

export function EmpresaProvider({ children }) {
  const [empresaId, setEmpresaId] = useState(() => localStorage.getItem(STORAGE_ID) || '');
  const [empresaNombre, setEmpresaNombre] = useState(() => localStorage.getItem(STORAGE_NAME) || '');
  const [themeName, setThemeName] = useState(() => localStorage.getItem(STORAGE_THEME) || THEME_KEYS[0]);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const setEmpresa = (empresa) => {
    if (!empresa) {
      localStorage.removeItem(STORAGE_ID);
      localStorage.removeItem(STORAGE_NAME);
      localStorage.removeItem(STORAGE_THEME);
      setEmpresaId('');
      setEmpresaNombre('');
      setThemeName(THEME_KEYS[0]);
      return;
    }
    localStorage.setItem(STORAGE_ID, empresa.id);
    localStorage.setItem(STORAGE_NAME, empresa.nombre);
    setEmpresaId(String(empresa.id));
    setEmpresaNombre(empresa.nombre);
    const storedThemes = loadThemeMap();
    const nextTheme = storedThemes[empresa.id] || pickThemeForEmpresa(empresa);
    localStorage.setItem(STORAGE_THEME, nextTheme);
    setThemeName(nextTheme);
  };

  const setEmpresaTheme = useCallback((empresaIdToSet, theme) => {
    if (!empresaIdToSet || !THEME_KEYS.includes(theme)) return;
    const storedThemes = loadThemeMap();
    const nextThemes = { ...storedThemes, [empresaIdToSet]: theme };
    localStorage.setItem(STORAGE_THEME_MAP, JSON.stringify(nextThemes));
    if (String(empresaIdToSet) === String(empresaId)) {
      localStorage.setItem(STORAGE_THEME, theme);
      setThemeName(theme);
    }
  }, [empresaId]);

  const refreshEmpresas = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setEmpresas([]);
      return;
    }
    setLoadingEmpresas(true);
    try {
      const res = await apiClient.get(apiUrl('empresas'));
      setEmpresas(res.data || []);
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      setEmpresas([]);
    } finally {
      setLoadingEmpresas(false);
    }
  }, []);

  useEffect(() => {
    refreshEmpresas();
  }, [refreshEmpresas]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeName;
  }, [themeName]);

  const value = useMemo(() => ({
    empresaId,
    empresaNombre,
    themeName,
    empresas,
    loadingEmpresas,
    setEmpresa,
    setEmpresaTheme,
    refreshEmpresas
  }), [empresaId, empresaNombre, themeName, empresas, loadingEmpresas, setEmpresaTheme, refreshEmpresas]);

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa debe usarse dentro de EmpresaProvider');
  }
  return context;
}
