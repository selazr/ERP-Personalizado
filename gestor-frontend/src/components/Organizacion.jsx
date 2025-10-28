import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart3, Building2, ChevronDown, MapPin } from 'lucide-react';
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

  const cardBaseClasses =
    'bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-2xl';
  const sectionTitleClasses = 'text-lg font-semibold text-slate-800 flex items-center gap-2';

  const renderWorker = (w, extra = null) => {
    const content = (
      <div className="flex justify-between text-sm items-center bg-slate-50 rounded-xl px-3 py-2">
        <span className="font-medium text-slate-700">{w.nombre}</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isActivo(w) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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
          className="w-full flex justify-between items-center gap-3 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
        >
          <span>{w.nombre}</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isActivo(w) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isActivo(w) ? 'Activo' : 'Inactivo'}
            </span>
            {extra}
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openWorkers[w.id] ? 'rotate-180' : ''
                }`}
              />
            </span>
          </div>
        </button>
        {openWorkers[w.id] && (
          <div className="ml-4 mt-2 text-xs text-slate-500">
            Caduca: {w.fecha_baja ? formatDate(w.fecha_baja) : 'Sin fecha'}
          </div>
        )}
      </>
    );
  };

  const fetchStats = async (companyCode = COMPANY_ALL) => {
    const token = localStorage.getItem('token');
    const params = {};

    if (companyCode !== COMPANY_ALL) {
      const paramValue = companyCode === COMPANY_NULL ? 'null' : companyCode;
      params.empresa = paramValue;
    }

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/trabajadores/organizacion`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    );

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

  const quickStats = useMemo(() => {
    if (!stats) return [];

    return [
      {
        label: 'Empresas disponibles',
        value: stats?.porEmpresa?.length ?? 0,
        icon: Building2
      },
      {
        label: 'Países representados',
        value: stats?.porPais?.length ?? 0,
        icon: MapPin
      },
      {
        label: 'Tipos de contrato',
        value: stats?.porContrato?.length ?? 0,
        icon: BarChart3
      },
      {
        label: 'Roles activos',
        value: stats?.porRol?.length ?? 0,
        icon: ChevronDown
      }
    ];
  }, [stats]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-4 sm:p-6">
        <div className="w-full max-w-6xl mx-auto mb-6 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
            Organización
          </h1>
          <p className="text-gray-600 mt-2">Resumen de empresas, países y antigüedad de trabajadores activos.</p>
        </div>

        {error && (
          <div className="w-full max-w-6xl mx-auto mb-4 bg-red-100 text-red-700 p-4 rounded-xl shadow">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-center text-gray-600 mt-12">Cargando datos...</p>
        )}

        {!stats ? null : (
          <>
            <div className="w-full max-w-6xl mx-auto px-4 mb-6">
              <div className={`${cardBaseClasses} p-4 sm:p-6 space-y-6`}>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-600">
                    Selecciona una empresa
                  </label>
                  <div className="mt-2 relative">
                    <select
                      id="company"
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                      className="block w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-6 text-white shadow-inner">
                    <span className="text-sm uppercase tracking-wide text-blue-100">Cantidad de trabajadores</span>
                    <p className="mt-2 text-4xl font-bold">
                      {stats.totalTrabajadores ?? 0}
                    </p>
                    <p className="mt-1 text-sm text-blue-100">
                      Datos correspondientes a {selectedCompanyLabel}
                    </p>
                  </div>

                  {quickStats.slice(0, 2).map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl bg-slate-50 border border-slate-200 p-6 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-sm font-medium uppercase tracking-wide">{label}</span>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-3xl font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>

                {quickStats.length > 2 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {quickStats.slice(2).map(({ label, value, icon: Icon }) => (
                      <div
                        key={`quick-${label}`}
                        className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-800">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full max-w-6xl mx-auto px-4 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className={`${cardBaseClasses} p-4 sm:p-6`}>
                  <h2 className={sectionTitleClasses}>
                    <MapPin className="h-5 w-5 text-blue-500" /> Trabajadores por país
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {(stats.porPais ?? []).map((p) => {
                      const key = p.pais || 'Sin especificar';
                      return (
                        <li key={key} className="rounded-2xl border border-slate-200 p-4">
                          <button
                            onClick={() => toggle(setOpenPaises, key)}
                            className="w-full flex justify-between items-center gap-3 text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <span>{key}</span>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="text-base font-semibold text-slate-800">{p.count}</span>
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    openPaises[key] ? 'rotate-180' : ''
                                  }`}
                                />
                              </span>
                            </div>
                          </button>
                          {openPaises[key] && (
                            <ul className="mt-3 space-y-2">
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

                <div className={`${cardBaseClasses} p-4 sm:p-6`}>
                  <h2 className={sectionTitleClasses}>
                    <Building2 className="h-5 w-5 text-indigo-500" /> Trabajadores con más antigüedad
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {(stats.veteranos ?? []).map((v) => (
                      <li key={v.id}>
                        {renderWorker(v, <span className="text-xs font-semibold text-slate-500">{v.antiguedad} años</span>)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className={`${cardBaseClasses} p-4 sm:p-6`}>
                  <h2 className={sectionTitleClasses}>Nuevas incorporaciones</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Último mes</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.incorporacionesMes}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Último trimestre</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.incorporacionesTrimestre}</span>
                    </li>
                  </ul>
                </div>

                <div className={`${cardBaseClasses} p-4 sm:p-6`}>
                  <h2 className={sectionTitleClasses}>Distribución por contrato</h2>
                  <ul className="mt-4 space-y-3">
                    {(stats.porContrato ?? []).map((c) => {
                      const key = c.tipo_trabajador || 'Sin especificar';
                      return (
                        <li key={key} className="rounded-2xl border border-slate-200 p-4">
                          <button
                            onClick={() => toggle(setOpenContratos, key)}
                            className="w-full flex justify-between items-center gap-3 text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <span>{key}</span>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="text-base font-semibold text-slate-800">{c.count}</span>
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    openContratos[key] ? 'rotate-180' : ''
                                  }`}
                                />
                              </span>
                            </div>
                          </button>
                          {openContratos[key] && (
                            <ul className="mt-3 space-y-2">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className={`${cardBaseClasses} p-4 sm:p-6`}>
                  <h2 className={sectionTitleClasses}>Distribución por rol</h2>
                  <ul className="mt-4 space-y-3">
                    {(stats.porRol ?? []).map((r) => {
                      const key = r.categoria || 'Sin especificar';
                      return (
                        <li key={key} className="rounded-2xl border border-slate-200 p-4">
                          <button
                            onClick={() => toggle(setOpenRoles, key)}
                            className="w-full flex justify-between items-center gap-3 text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <span>{key}</span>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="text-base font-semibold text-slate-800">{r.count}</span>
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    openRoles[key] ? 'rotate-180' : ''
                                  }`}
                                />
                              </span>
                            </div>
                          </button>
                          {openRoles[key] && (
                            <ul className="mt-3 space-y-2">
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

                <div className={`${cardBaseClasses} p-4 sm:p-6`}>
                  <h2 className={sectionTitleClasses}>Promedios y extras</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Edad promedio (años)</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.edadPromedio?.toFixed(1)}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Horas/semana</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.promedioHorasSemana?.toFixed(1)}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Horas/mes</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.promedioHorasMes?.toFixed(1)}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Horas extras acumuladas</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.horasExtrasAcumuladas?.toFixed(1)}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span>Horas extras pagadas</span>
                      <span className="text-lg font-semibold text-slate-900">{stats.horasExtrasPagadas?.toFixed(1)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
