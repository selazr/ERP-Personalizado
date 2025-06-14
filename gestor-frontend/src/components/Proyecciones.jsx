import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Proyecciones() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/trabajadores/estadisticas`, {
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

  const chartData = stats ? [
    { name: 'Mensual Bruto', value: stats.costeMensualBruto },
    { name: 'Anual Bruto', value: stats.costeAnualBruto },
    { name: 'Bruto Promedio', value: stats.salarioBrutoPromedio },
  ] : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-5xl mx-auto mb-6 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
            Proyecciones y Estadísticas
          </h1>
          <p className="text-gray-600 mt-2">Visualiza el estado económico de tu plantilla.</p>
        </div>

        {error && (
          <div className="max-w-5xl mx-auto mb-4 bg-red-100 text-red-700 p-4 rounded shadow">
            {error}
          </div>
        )}

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
              <StatCard title="Trabajadores totales" value={stats.totalTrabajadores} />
              <StatCard title="Activos" value={stats.trabajadoresActivos} />
              <StatCard title="Inactivos" value={stats.trabajadoresInactivos} />
              <StatCard title="Coste mensual bruto" value={`€ ${stats.costeMensualBruto}`} />
              <StatCard title="Coste anual bruto" value={`€ ${stats.costeAnualBruto}`} />
              <StatCard title="Salario bruto promedio" value={`€ ${stats.salarioBrutoPromedio.toFixed(2)}`} />
            </div>

            <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Gráfico comparativo</h2>
              <div className="w-full h-80">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 mt-12">Cargando estadísticas...</p>
        )}
      </div>
    </>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition text-center">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-blue-700 mt-2">{value}</p>
    </div>
  );
}
