import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header';

export default function Proyecciones() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas');
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-100 p-6">
        <h1 className="text-2xl font-bold mb-4">Proyecciones y Estadísticas</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500">Trabajadores totales</p>
              <p className="text-2xl font-semibold">{stats.totalTrabajadores}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500">Activos</p>
              <p className="text-2xl font-semibold">{stats.trabajadoresActivos}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500">Inactivos</p>
              <p className="text-2xl font-semibold">{stats.trabajadoresInactivos}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500">Coste mensual bruto</p>
              <p className="text-2xl font-semibold">€ {stats.costeMensualBruto}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500">Coste anual bruto</p>
              <p className="text-2xl font-semibold">€ {stats.costeAnualBruto}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500">Salario bruto promedio</p>
              <p className="text-2xl font-semibold">€ {stats.salarioBrutoPromedio.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p>Cargando...</p>
        )}
      </div>
    </>
  );
}

