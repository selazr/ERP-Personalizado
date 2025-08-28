import { formatCurrency } from '@/utils/utils';

export default function SalaryTable({ workers = [] }) {
  const validWorkers = workers.filter((w) => Number.isFinite(w.neto));
  if (!validWorkers.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-gray-900">
        <thead>
          <tr>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Salario (€)</th>
          </tr>
        </thead>
        <tbody>
          {validWorkers.map((w) => (
            <tr key={w.id}>
              <td className="border px-2 py-1">{w.name}</td>
              <td className="border px-2 py-1">€{formatCurrency(w.neto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
