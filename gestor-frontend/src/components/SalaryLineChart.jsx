import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/utils/utils';

export default function SalaryLineChart({ workers = [] }) {
  let invalidCount = 0;
  const validWorkers = [];

  workers.forEach((w) => {
    const bruto = Number(w.bruto);
    const neto = Number(w.neto);
    if (Number.isFinite(bruto) && Number.isFinite(neto)) {
      validWorkers.push({ ...w, bruto, neto });
    } else {
      invalidCount += 1;
    }
  });

  const maxSalary = validWorkers.length
    ? Math.max(...validWorkers.map(w => Math.max(w.bruto, w.neto)))
    : 0;
  const maxRange = Math.ceil(maxSalary / 100) * 100 || 100;
  const binsCount = Math.ceil(maxRange / 100);

  const bins = Array.from({ length: binsCount }, (_, i) => {
    const start = i * 100;
    return {
      x: start,
      label: `${start}–${start + 100}`,
      bruto: 0,
      neto: 0,
      workersBruto: [],
      workersNeto: []
    };
  });

  validWorkers.forEach((w) => {
    const indexBruto = Math.min(Math.floor(w.bruto / 100), bins.length - 1);
    bins[indexBruto].bruto += 1;
    bins[indexBruto].workersBruto.push(w);

    const indexNeto = Math.min(Math.floor(w.neto / 100), bins.length - 1);
    bins[indexNeto].neto += 1;
    bins[indexNeto].workersNeto.push(w);
  });

  const step = bins.length > 20 ? 500 : 100;
  const ticks = [];
  for (let t = 0; t <= maxRange; t += step) {
    ticks.push(t);
  }
  if (!ticks.includes(maxRange)) ticks.push(maxRange);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { label, bruto, neto, workersBruto, workersNeto } = payload[0].payload;
    return (
      <div className="bg-white text-gray-800 p-2 border rounded shadow text-sm max-w-xs">
        <p className="font-semibold">{label}</p>
        <p>{`Bruto: ${bruto}`}</p>
        {workersBruto?.length > 0 && (
          <ul className="mt-1 space-y-1">
            {workersBruto.map((w, idx) => (
              <li key={`b-${idx}`} className="flex items-center justify-between">
                <span>{w.name}</span>
                <span className="ml-2">B: €{formatCurrency(w.bruto)}</span>
                <span className="ml-2">N: €{formatCurrency(w.neto)}</span>
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
        <p>{`Neto: ${neto}`}</p>
        {workersNeto?.length > 0 && (
          <ul className="mt-1 space-y-1">
            {workersNeto.map((w, idx) => (
              <li key={`n-${idx}`} className="flex items-center justify-between">
                <span>{w.name}</span>
                <span className="ml-2">B: €{formatCurrency(w.bruto)}</span>
                <span className="ml-2">N: €{formatCurrency(w.neto)}</span>
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
            <Legend />
            <Line type="monotone" dataKey="bruto" stroke="#6366f1" name="Bruto" dot />
            <Line type="monotone" dataKey="neto" stroke="#34d399" name="Neto" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {invalidCount > 0 && (
        <p className="text-sm text-gray-500 mt-2">Registros sin salario: {invalidCount}</p>
      )}
    </div>
  );
}

