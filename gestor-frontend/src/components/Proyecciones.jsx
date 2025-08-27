import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/utils/utils';
import SalaryLineChart from '@/components/SalaryLineChart';

function isActivo(trabajador) {
  const today = new Date();
  const fechaAlta = new Date(trabajador.fecha_alta);
  const fechaBaja = trabajador.fecha_baja ? new Date(trabajador.fecha_baja) : null;
  return fechaAlta <= today && (!fechaBaja || fechaBaja >= today);
}

export default function Proyecciones() {
  const [stats, setStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, workersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/trabajadores/estadisticas`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/trabajadores`, { headers })
        ]);
        setStats(statsRes.data);
        const mappedWorkers = workersRes.data.map((w) => ({
          id: w.id,
          name: w.nombre,
          bruto: Number(w.salario_bruto),
          neto: Number(w.salario_neto),
          active: isActivo(w)
        }));
        setWorkers(mappedWorkers);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas');
      }
    };

    fetchData();
  }, []);

  const chartData = stats
    ? [
        {
          name: 'Mensual',
          Bruto: stats.costeMensualBruto,
          Neto: stats.costeMensualNeto,
        },
        {
          name: 'Anual',
          Bruto: stats.costeAnualBruto,
          Neto: stats.costeAnualNeto,
        },
        {
          name: 'Promedio',
          Bruto: stats.salarioBrutoPromedio,
          Neto: stats.salarioNetoPromedio,
        },
      ]
    : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
            Proyecciones y Estadísticas
          </h1>
          <p className="text-gray-600 mt-2">Visualiza el estado económico de tu plantilla.</p>
        </div>

        {error && (
          <div className="w-full max-w-5xl mx-auto mb-4 bg-red-100 text-red-700 p-4 rounded shadow">
            {error}
          </div>
        )}

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl mx-auto mb-10 px-4">
              <StatCard title="Trabajadores totales" value={stats.totalTrabajadores} />
              <StatCard title="Activos" value={stats.trabajadoresActivos} />
              <StatCard title="Inactivos" value={stats.trabajadoresInactivos} />
              <StatCard title="Coste mensual bruto" value={`€ ${formatCurrency(stats.costeMensualBruto)}`} />
              <StatCard title="Coste mensual neto" value={`€ ${formatCurrency(stats.costeMensualNeto)}`} />
              <StatCard title="Coste anual bruto" value={`€ ${formatCurrency(stats.costeAnualBruto)}`} />
              <StatCard title="Coste anual neto" value={`€ ${formatCurrency(stats.costeAnualNeto)}`} />
              <StatCard title="Salario bruto promedio" value={`€ ${formatCurrency(stats.salarioBrutoPromedio)}`} />
              <StatCard title="Salario neto promedio" value={`€ ${formatCurrency(stats.salarioNetoPromedio)}`} />
            </div>

            <div className="w-full max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-xl">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">Gráfico comparativo</h2>
              <div className="w-full h-80">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Bruto" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Neto" fill="#34d399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="w-full max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-xl mt-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">Distribución de salarios</h2>
              <SalaryLineChart workers={workers} />
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
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow hover:shadow-md transition text-center">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-blue-700 mt-2">{value}</p>
    </div>
  );
}
