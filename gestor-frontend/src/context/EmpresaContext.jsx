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
  const [autonomoId, setAutonomoId] = useState(() => localStorage.getItem('autonomoId') || '');
  const [autonomoNombre, setAutonomoNombre] = useState(() => localStorage.getItem('autonomoNombre') || '');
  const [isAutonomo, setIsAutonomo] = useState(() => localStorage.getItem('isAutonomo') === 'true');
  const [themeName, setThemeName] = useState(() => localStorage.getItem(STORAGE_THEME) || THEME_KEYS[0]);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const setEmpresa = (empresa) => {
    if (!empresa) {
      localStorage.removeItem(STORAGE_ID);
      localStorage.removeItem(STORAGE_NAME);
      localStorage.removeItem('autonomoId');
      localStorage.removeItem('autonomoNombre');
      localStorage.removeItem('isAutonomo');
      localStorage.removeItem(STORAGE_THEME);
      setEmpresaId('');
      setEmpresaNombre('');
      setAutonomoId('');
      setAutonomoNombre('');
      setIsAutonomo(false);
      setThemeName(THEME_KEYS[0]);
      return;
    }

    if (empresa.esAutonomo || String(empresa.id).startsWith('autonomo_')) {
      const cleanId = String(empresa.id).replace('autonomo_', '');
      
      localStorage.removeItem(STORAGE_ID);
      localStorage.removeItem(STORAGE_NAME);
      setEmpresaId('');
      setEmpresaNombre('');

      localStorage.setItem('autonomoId', cleanId);
      localStorage.setItem('autonomoNombre', empresa.nombre);
      localStorage.setItem('isAutonomo', 'true');
      setAutonomoId(cleanId);
      setAutonomoNombre(empresa.nombre);
      setIsAutonomo(true);

      const storedThemes = loadThemeMap();
      const themeKey = `autonomo_${cleanId}`;
      const nextTheme = storedThemes[themeKey] || pickThemeForEmpresa({ id: cleanId, nombre: empresa.nombre });
      localStorage.setItem(STORAGE_THEME, nextTheme);
      setThemeName(nextTheme);
    } else {
      localStorage.removeItem('autonomoId');
      localStorage.removeItem('autonomoNombre');
      localStorage.removeItem('isAutonomo');
      setAutonomoId('');
      setAutonomoNombre('');
      setIsAutonomo(false);

      localStorage.setItem(STORAGE_ID, empresa.id);
      localStorage.setItem(STORAGE_NAME, empresa.nombre);
      setEmpresaId(String(empresa.id));
      setEmpresaNombre(empresa.nombre);

      const storedThemes = loadThemeMap();
      const nextTheme = storedThemes[empresa.id] || pickThemeForEmpresa(empresa);
      localStorage.setItem(STORAGE_THEME, nextTheme);
      setThemeName(nextTheme);
    }
  };

  const setEmpresaTheme = useCallback((idToSet, theme) => {
    if (!idToSet || !THEME_KEYS.includes(theme)) return;
    const cleanId = String(idToSet).replace('autonomo_', '');
    const isAutonomoId = String(idToSet).startsWith('autonomo_') || isAutonomo;
    const themeKey = isAutonomoId ? `autonomo_${cleanId}` : String(cleanId);

    const storedThemes = loadThemeMap();
    const nextThemes = { ...storedThemes, [themeKey]: theme };
    localStorage.setItem(STORAGE_THEME_MAP, JSON.stringify(nextThemes));

    const currentActiveId = isAutonomo ? autonomoId : empresaId;
    if (String(cleanId) === String(currentActiveId)) {
      localStorage.setItem(STORAGE_THEME, theme);
      setThemeName(theme);
    }
  }, [empresaId, autonomoId, isAutonomo]);

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
    autonomoId,
    autonomoNombre,
    isAutonomo,
    themeName,
    empresas,
    loadingEmpresas,
    setEmpresa,
    setEmpresaTheme,
    refreshEmpresas
  }), [
    empresaId,
    empresaNombre,
    autonomoId,
    autonomoNombre,
    isAutonomo,
    themeName,
    empresas,
    loadingEmpresas,
    setEmpresaTheme,
    refreshEmpresas
  ]);

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
