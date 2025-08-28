import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/utils';

export default function SalaryLineChart({ workers = [], onRangeSelect, resetKey }) {
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
    ? Math.max(...validWorkers.map((w) => w.neto))
    : 0;
  const maxRange = Math.ceil(maxSalary / 100) * 100 || 100;
  const binsCount = Math.ceil(maxRange / 100);

  const bins = Array.from({ length: binsCount }, (_, i) => {
    const start = i * 100;
    return {
      x: start,
      label: `${start}–${start + 100}`,
      count: 0,
      workers: []
    };
  });

  validWorkers.forEach((w) => {
    const index = Math.min(Math.floor(w.neto / 100), bins.length - 1);
    bins[index].count += 1;
    bins[index].workers.push(w);
  });

  const step = bins.length > 20 ? 500 : 100;
  const ticks = [];
  for (let t = 0; t <= maxRange; t += step) {
    ticks.push(t);
  }
  if (!ticks.includes(maxRange)) ticks.push(maxRange);

  const [selection, setSelection] = useState({ from: null, to: null });

  useEffect(() => {
    setSelection({ from: null, to: null });
  }, [resetKey]);

  const domain =
    selection.from !== null && selection.to !== null
      ? [selection.from, selection.to]
      : [0, maxRange];

  const handleClick = (e) => {
    if (e?.activeLabel === undefined || e.activeLabel === null) return;
    const value = Math.floor(Number(e.activeLabel) / 100) * 100;

    if (selection.from !== null && selection.to !== null) {
      setSelection({ from: value, to: null });
      onRangeSelect?.(null);
      return;
    }

    if (selection.from === null) {
      setSelection({ from: value, to: null });
    } else {
      let from = selection.from;
      let to = value;
      if (to < from) [from, to] = [to, from];
      if (from === to) to = from + 100;
      const range = { from, to };
      setSelection(range);
      onRangeSelect?.(range);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { label, count, workers } = payload[0].payload;
    return (
      <div className="bg-white text-gray-800 p-2 border rounded shadow text-sm max-w-xs">
        <p className="font-semibold">{label}</p>
        <p>{`Personas: ${count}`}</p>
        {workers?.length > 0 && (
          <ul className="mt-1 space-y-1">
            {workers.map((w, idx) => (
              <li key={idx} className="flex items-center justify-between">
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
      <div className="w-full h-80 mb-4">
        <ResponsiveContainer>
          <LineChart
            data={bins}
            aria-label="Gráfica de distribución salarial"
            onClick={handleClick}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={domain}
              ticks={ticks}
              tickFormatter={(v) => `€${formatCurrency(v)}`}
            />
            <YAxis type="number" allowDecimals={false} domain={[0, 'dataMax + 1']} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="count" stroke="#6366f1" name="Salarios" dot />
            {selection.from !== null && selection.to !== null && (
              <ReferenceArea x1={selection.from} x2={selection.to} strokeOpacity={0.3} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {invalidCount > 0 && (
        <p className="text-sm text-gray-500 mt-2">Registros sin salario: {invalidCount}</p>
      )}
    </div>
  );
}

