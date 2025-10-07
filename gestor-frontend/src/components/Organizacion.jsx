import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import { isActivo, formatDate } from '@/components/Trabajador';

export default function Organizacion() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [openEmpresas, setOpenEmpresas] = useState({});
  const [openPaises, setOpenPaises] = useState({});
  const [openContratos, setOpenContratos] = useState({});
  const [openRoles, setOpenRoles] = useState({});
  const [openWorkers, setOpenWorkers] = useState({});

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/trabajadores/organizacion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas de organización');
      }
    };

    fetchStats();
  }, []);

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

        {!stats ? (
          <p className="text-center text-gray-600 mt-12">Cargando datos...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-5xl mx-auto px-4">
              <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Trabajadores por empresa</h2>
                <ul className="space-y-2">
                  {stats.porEmpresa.map((e) => {
                    const key = e.empresa || 'Sin especificar';
                    return (
                      <li key={key} className="">
                        <button
                          onClick={() => toggle(setOpenEmpresas, key)}
                          className="w-full flex justify-between items-center"
                        >
                          <span>{key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{e.count}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                openEmpresas[key] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {openEmpresas[key] && (
                          <ul className="mt-2 ml-4 space-y-1">
                            {e.workers.map(w => (
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
