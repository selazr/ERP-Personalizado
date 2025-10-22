import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import { isActivo, formatDate } from '@/components/Trabajador';

const COMPANY_ALL = '__ALL__';
const COMPANY_NULL = '__NULL__';

export default function Organizacion() {
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(COMPANY_ALL);
  const [openPaises, setOpenPaises] = useState({});
  const [openContratos, setOpenContratos] = useState({});
  const [openRoles, setOpenRoles] = useState({});
  const [openWorkers, setOpenWorkers] = useState({});

  const selectedCompanyLabel = useMemo(() => {
    if (selectedCompany === COMPANY_ALL) {
      return 'todas las empresas';
    }

    const company = companies.find(c => c.value === selectedCompany);
    return company ? company.label : 'empresa seleccionada';
  }, [companies, selectedCompany]);

  const toggle = (setter, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expiringContracts = ['Fijo discontinuo', 'Temporal', 'Prácticas'];

  const renderWorker = (w, extra = null) => {
    const content = (
      <div className="flex justify-between text-sm items-center">
        <span>{w.nombre}</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isActivo(w) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isActivo(w) ? 'Activo' : 'Inactivo'}
          </span>
          {extra}
        </div>
      </div>
    );

    if (!expiringContracts.includes(w.tipo_trabajador)) {
      return content;
    }

    return (
      <>
        <button
          onClick={() => toggle(setOpenWorkers, w.id)}
          className="w-full flex justify-between items-center text-sm"
        >
          <span>{w.nombre}</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isActivo(w) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isActivo(w) ? 'Activo' : 'Inactivo'}
            </span>
            {extra}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openWorkers[w.id] ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        {openWorkers[w.id] && (
          <div className="ml-4 mt-1 text-xs text-gray-600">
            Caduca: {w.fecha_baja ? formatDate(w.fecha_baja) : 'Sin fecha'}
          </div>
        )}
      </>
    );
  };

  const fetchStats = async (companyCode = COMPANY_ALL) => {
    const token = localStorage.getItem('token');
    const url = new URL(`${import.meta.env.VITE_API_URL}/trabajadores/organizacion`);

    if (companyCode !== COMPANY_ALL) {
      const paramValue = companyCode === COMPANY_NULL ? 'null' : companyCode;
      url.searchParams.set('empresa', paramValue);
    }

    const res = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.data;
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetchStats();
        setStats(data);
        setGlobalStats(data);
        const availableCompanies = (data?.porEmpresa || [])
          .map(e => ({
            label: e.empresa ?? 'Sin especificar',
            value: e.empresa ?? COMPANY_NULL
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setCompanies(availableCompanies);
        setError('');
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas de organización');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    setOpenPaises({});
    setOpenContratos({});
    setOpenRoles({});
    setOpenWorkers({});
  }, [stats]);

  const handleCompanyChange = async event => {
    const value = event.target.value;
    setSelectedCompany(value);

    if (value === COMPANY_ALL) {
      setStats(globalStats);
      setError('');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchStats(value);
      setStats(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las estadísticas de la empresa seleccionada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
            Organización
          </h1>
          <p className="text-gray-600 mt-2">Resumen de empresas, países y antigüedad de trabajadores activos.</p>
        </div>

        {error && (
          <div className="w-full max-w-5xl mx-auto mb-4 bg-red-100 text-red-700 p-4 rounded shadow">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-center text-gray-600 mt-12">Cargando datos...</p>
        )}

        {!stats ? null : (
          <>
            <div className="w-full max-w-5xl mx-auto px-4 mb-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow space-y-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-600">
                    Selecciona una empresa
                  </label>
                  <div className="mt-2 relative">
                    <select
                      id="company"
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                      className="block w-full appearance-none rounded-lg border border-gray-200 bg-slate-50 px-4 py-2 pr-10 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      disabled={!companies.length && !globalStats}
                    >
                      <option value={COMPANY_ALL}>Todas las empresas</option>
                      {companies.map(company => (
                        <option key={company.value ?? 'sin-especificar'} value={company.value}>
                          {company.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-6 text-white shadow-inner">
                  <span className="text-sm uppercase tracking-wide text-blue-100">Cantidad de trabajadores</span>
                  <p className="mt-2 text-4xl font-bold">
                    {stats.totalTrabajadores ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-blue-100">
                    Datos correspondientes a {selectedCompanyLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-5xl mx-auto px-4">
              <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Trabajadores por país</h2>
                <ul className="space-y-2">
                  {stats.porPais.map((p) => {
                    const key = p.pais || 'Sin especificar';
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(setOpenPaises, key)}
                          className="w-full flex justify-between items-center"
                        >
                          <span>{key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{p.count}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                openPaises[key] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {openPaises[key] && (
                          <ul className="mt-2 ml-4 space-y-1">
                            {p.workers.map(w => (
                              <li key={w.id}>{renderWorker(w)}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="w-full max-w-5xl mx-auto mt-6 bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4">Trabajadores con más antigüedad</h2>
              <ul className="space-y-2">
                {stats.veteranos.map((v) => (
                  <li key={v.id}>
                    {renderWorker(v, <span className="font-bold">{v.antiguedad} años</span>)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-5xl mx-auto mt-6 px-4">
              <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Nuevas incorporaciones</h2>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Último mes</span>
                    <span className="font-bold">{stats.incorporacionesMes}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Último trimestre</span>
                    <span className="font-bold">{stats.incorporacionesTrimestre}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Distribución por contrato</h2>
                <ul className="space-y-2">
                  {stats.porContrato.map((c) => {
                    const key = c.tipo_trabajador || 'Sin especificar';
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(setOpenContratos, key)}
                          className="w-full flex justify-between items-center"
                        >
                          <span>{key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{c.count}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                openContratos[key] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {openContratos[key] && (
                          <ul className="mt-2 ml-4 space-y-1">
                            {c.workers.map(w => (
                              <li key={w.id}>{renderWorker(w)}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-5xl mx-auto mt-6 px-4">
              <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Distribución por rol</h2>
                <ul className="space-y-2">
                  {stats.porRol.map((r) => {
                    const key = r.categoria || 'Sin especificar';
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(setOpenRoles, key)}
                          className="w-full flex justify-between items-center"
                        >
                          <span>{key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{r.count}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                openRoles[key] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {openRoles[key] && (
                          <ul className="mt-2 ml-4 space-y-1">
                            {r.workers.map(w => (
                              <li key={w.id}>{renderWorker(w)}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Promedios y extras</h2>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Edad promedio (años)</span>
                    <span className="font-bold">{stats.edadPromedio?.toFixed(1)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Horas/semana</span>
                    <span className="font-bold">{stats.promedioHorasSemana?.toFixed(1)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Horas/mes</span>
                    <span className="font-bold">{stats.promedioHorasMes?.toFixed(1)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Horas extras acumuladas</span>
                    <span className="font-bold">{stats.horasExtrasAcumuladas?.toFixed(1)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Horas extras pagadas</span>
                    <span className="font-bold">{stats.horasExtrasPagadas?.toFixed(1)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
