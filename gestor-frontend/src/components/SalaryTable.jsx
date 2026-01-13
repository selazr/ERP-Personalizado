import { formatCurrency } from '@/utils/utils';

export default function SalaryTable({ workers = [] }) {
  const validWorkers = workers.filter((w) => Number.isFinite(w.neto));
  if (!validWorkers.length) return null;

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-left border-collapse"
        style={{ color: 'var(--theme-text)' }}
      >
        <thead>
          <tr>
            <th className="border px-2 py-1" style={{ borderColor: 'var(--theme-card-border)' }}>
              Nombre
            </th>
            <th className="border px-2 py-1" style={{ borderColor: 'var(--theme-card-border)' }}>
              Salario (€)
            </th>
          </tr>
        </thead>
        <tbody>
          {validWorkers.map((w) => (
            <tr key={w.id}>
              <td className="border px-2 py-1" style={{ borderColor: 'var(--theme-card-border)' }}>
                {w.name}
              </td>
              <td className="border px-2 py-1" style={{ borderColor: 'var(--theme-card-border)' }}>
                €{formatCurrency(w.neto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
