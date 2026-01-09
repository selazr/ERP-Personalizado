import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCcw } from 'lucide-react';
import { useEmpresa } from '@/context/EmpresaContext';

export default function EmpresaSelector() {
  const navigate = useNavigate();
  const {
    empresaId,
    empresas,
    loadingEmpresas,
    setEmpresa,
    refreshEmpresas
  } = useEmpresa();
  const [selectedId, setSelectedId] = useState('');

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

  const selectedEmpresa = useMemo(() => (
    empresas.find((empresa) => String(empresa.id) === selectedId)
  ), [empresas, selectedId]);

  const handleConfirm = () => {
    if (!selectedEmpresa) return;
    setEmpresa(selectedEmpresa);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Selecciona empresa</h1>
            <p className="text-sm text-slate-500">Elige el tenant con el que vas a trabajar.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Empresa activa
          </label>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loadingEmpresas}
            >
              <option value="">Selecciona una empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={refreshEmpresas}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
              disabled={loadingEmpresas}
            >
              <RefreshCcw className="h-4 w-4" />
              {loadingEmpresas ? 'Actualizando...' : 'Actualizar lista'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedEmpresa}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-semibold shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
