import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/utils';

export default function SalaryLineChart({ workers = [] }) {
  let invalidCount = 0;
  const validWorkers = [];

  workers.forEach((w) => {
    const salary = Number(w.salary);
    if (Number.isFinite(salary)) {
      validWorkers.push({ ...w, salary });
    } else {
      invalidCount += 1;
    }
  });

  const maxSalary = validWorkers.length ? Math.max(...validWorkers.map(w => w.salary)) : 0;
  const maxRange = Math.ceil(maxSalary / 100) * 100 || 100;
  const binsCount = Math.ceil(maxRange / 100);

  const bins = Array.from({ length: binsCount }, (_, i) => {
    const start = i * 100;
    return { x: start, y: 0, label: `${start}–${start + 100}` , workers: [] };
  });

  validWorkers.forEach((w) => {
    const index = Math.min(Math.floor(w.salary / 100), bins.length - 1);
    bins[index].y += 1;
    bins[index].workers.push(w);
  });

  const step = bins.length > 20 ? 500 : 100;
  const ticks = [];
  for (let t = 0; t <= maxRange; t += step) {
    ticks.push(t);
  }
  if (!ticks.includes(maxRange)) ticks.push(maxRange);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { label, y, workers: ws } = payload[0].payload;
    return (
      <div className="bg-white text-gray-800 p-2 border rounded shadow text-sm max-w-xs">
        <p className="font-semibold">{label}</p>
        <p>{`Personas: ${y}`}</p>
        {ws?.length > 0 && (
          <ul className="mt-1 space-y-1">
            {ws.map((w, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span>{w.name}</span>
                <span className="ml-2">€{formatCurrency(w.salary)}</span>
                <span
                  className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    w.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {w.active ? 'Activo' : 'Inactivo'}
                </span>
              </li>
            ))}
          </ul>
        )}
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

