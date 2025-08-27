import { ComposedChart, Bar, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/utils';

export default function SalaryBinsWithPoints({ workers = [] }) {
  const bins = [
    { label: '0–1000', min: 0, max: 1000 },
    { label: '1000–1500', min: 1000, max: 1500 },
    { label: '1500–2000', min: 1500, max: 2000 },
    { label: '>2000', min: 2000, max: Infinity }
  ];

  const binData = bins.map((b, index) => ({ index, range: b.label, count: 0 }));
  const points = [];
  let invalidCount = 0;

  workers.forEach((w) => {
    const salary = Number(w.salary);
    if (!Number.isFinite(salary)) {
      invalidCount += 1;
      return;
    }
    const binIndex = bins.findIndex((b) => salary >= b.min && salary < b.max);
    if (binIndex === -1) {
      invalidCount += 1;
      return;
    }
    binData[binIndex].count += 1;
    const jitter = (Math.random() - 0.5) * 0.8; // para evitar puntos montados
    points.push({
      x: binIndex + jitter,
      y: salary,
      name: w.name,
      salary,
      range: bins[binIndex].label
    });
  });

  const ticks = binData.map((d) => d.index);
  const tickFormatter = (idx) => binData[idx]?.range || '';

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    if (data.count !== undefined) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p>{`Tramo ${data.range}`}</p>
          <p>{`Personas: ${data.count}`}</p>
        </div>
      );
    }
    return (
      <div className="bg-white p-2 border rounded shadow text-sm">
        <p>{data.name}</p>
        <p>{`Salario: € ${formatCurrency(data.salary)}`}</p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full h-80">
        <ResponsiveContainer>
          <ComposedChart data={binData} aria-label="Gráfica de distribución salarial">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="index"
              ticks={ticks}
              domain={[ -0.5, bins.length - 0.5 ]}
              tickFormatter={tickFormatter}
            />
            <YAxis yAxisId="left" allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `€${formatCurrency(v)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Personas" fill="#6366f1" barSize={40} />
            <Scatter yAxisId="right" data={points} name="Trabajadores" fill="#82ca9d" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {invalidCount > 0 && (
        <p className="text-sm text-gray-500 mt-2">Registros sin salario: {invalidCount}</p>
      )}
    </div>
  );
}
