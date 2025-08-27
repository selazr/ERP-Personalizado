import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/utils';

export default function SalaryLineChart({ workers = [] }) {
  const numericSalaries = [];
  let invalidCount = 0;

  workers.forEach((w) => {
    const salary = Number(w.salary);
    if (Number.isFinite(salary)) {
      numericSalaries.push(salary);
    } else {
      invalidCount += 1;
    }
  });

  const maxSalary = numericSalaries.length ? Math.max(...numericSalaries) : 0;
  const maxRange = Math.ceil(maxSalary / 100) * 100 || 100;
  const binsCount = Math.ceil(maxRange / 100);

  const bins = Array.from({ length: binsCount }, (_, i) => {
    const start = i * 100;
    return { x: start, y: 0, label: `${start}–${start + 100}` };
  });

  numericSalaries.forEach((salary) => {
    const index = Math.min(Math.floor(salary / 100), bins.length - 1);
    bins[index].y += 1;
  });

  const step = bins.length > 20 ? 500 : 100;
  const ticks = [];
  for (let t = 0; t <= maxRange; t += step) {
    ticks.push(t);
  }
  if (!ticks.includes(maxRange)) ticks.push(maxRange);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { label, y } = payload[0].payload;
    return (
      <div className="bg-white p-2 border rounded shadow text-sm">
        <p>{label}</p>
        <p>{`Personas: ${y}`}</p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full h-80">
        <ResponsiveContainer>
          <LineChart data={bins} aria-label="Gráfica de distribución salarial">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, maxRange]}
              ticks={ticks}
              tickFormatter={(v) => `€${formatCurrency(v)}`}
            />
            <YAxis type="number" allowDecimals={false} domain={[0, 'dataMax + 1']} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="y" stroke="#6366f1" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {invalidCount > 0 && (
        <p className="text-sm text-gray-500 mt-2">Registros sin salario: {invalidCount}</p>
      )}
    </div>
  );
}

