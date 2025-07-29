import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header';

export default function Organizacion() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

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
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-5xl mx-auto mb-6 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
            Organización
          </h1>
          <p className="text-gray-600 mt-2">Resumen de empresas, países y antigüedad.</p>
        </div>

        {error && (
          <div className="max-w-5xl mx-auto mb-4 bg-red-100 text-red-700 p-4 rounded shadow">
            {error}
          </div>
        )}

        {!stats ? (
          <p className="text-center text-gray-600 mt-12">Cargando datos...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Trabajadores por empresa</h2>
                <ul className="space-y-2">
                  {stats.porEmpresa.map((e) => (
                    <li key={e.empresa} className="flex justify-between">
                      <span>{e.empresa || 'Sin especificar'}</span>
                      <span className="font-bold">{e.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Trabajadores por país</h2>
                <ul className="space-y-2">
                  {stats.porPais.map((p) => (
                    <li key={p.pais} className="flex justify-between">
                      <span>{p.pais || 'Sin especificar'}</span>
                      <span className="font-bold">{p.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="max-w-5xl mx-auto mt-6 bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4">Trabajadores con más antigüedad</h2>
              <ul className="space-y-2">
                {stats.veteranos.map((v) => (
                  <li key={v.id} className="flex justify-between">
                    <span>{v.nombre}</span>
                    <span className="font-bold">{v.antiguedad} años</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}
