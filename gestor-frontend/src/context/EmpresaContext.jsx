import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '@/utils/apiClient';
import { apiUrl } from '@/utils/api';

const EmpresaContext = createContext(null);

const STORAGE_ID = 'empresaId';
const STORAGE_NAME = 'empresaNombre';

export function EmpresaProvider({ children }) {
  const [empresaId, setEmpresaId] = useState(() => localStorage.getItem(STORAGE_ID) || '');
  const [empresaNombre, setEmpresaNombre] = useState(() => localStorage.getItem(STORAGE_NAME) || '');
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const setEmpresa = (empresa) => {
    if (!empresa) {
      localStorage.removeItem(STORAGE_ID);
      localStorage.removeItem(STORAGE_NAME);
      setEmpresaId('');
      setEmpresaNombre('');
      return;
    }
    localStorage.setItem(STORAGE_ID, empresa.id);
    localStorage.setItem(STORAGE_NAME, empresa.nombre);
    setEmpresaId(String(empresa.id));
    setEmpresaNombre(empresa.nombre);
  };

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

  const value = useMemo(() => ({
    empresaId,
    empresaNombre,
    empresas,
    loadingEmpresas,
    setEmpresa,
    refreshEmpresas
  }), [empresaId, empresaNombre, empresas, loadingEmpresas, refreshEmpresas]);

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
