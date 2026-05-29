import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Search, User, X } from 'lucide-react';
export default function WorkerAutocomplete({ workers = [], selectedId, onChange, variant = 'compact' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selectedWorker = workers.find(w => w.id === Number(selectedId));
  const isActiveVariant = variant === 'active';

  useEffect(() => {
    if (selectedWorker) {
      setQuery(selectedWorker.nombre);
    }
  }, [selectedWorker]);

  const filtered = workers.filter(w => w.nombre.toLowerCase().includes(query.toLowerCase()));
  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  const getWorkerSubtitle = (worker = {}) => {
    if (worker.autonomo) return 'Autónomo';
    const details = [worker.categoria, worker.tipo_trabajador].filter(Boolean);
    return details.length ? details.join(' · ') : 'Sin contrato asignado';
  };

  const handleSelect = (worker) => {
    onChange(worker.id);
    setQuery(worker.nombre);
    setOpen(false);
  };

  return (
    <div className={`relative w-full ${isActiveVariant ? 'sm:w-80' : 'sm:w-64'}`}>
      {isActiveVariant && selectedWorker && (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {getInitials(selectedWorker.nombre) || <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trabajador activo</p>
            <p className="truncate text-sm font-semibold text-slate-900">{selectedWorker.nombre}</p>
            <p className="truncate text-xs text-slate-500">{getWorkerSubtitle(selectedWorker)}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder={selectedWorker ? 'Cambiar trabajador...' : 'Buscar trabajador...'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              setOpen(true);
            }}
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
          {filtered.map((w) => (
            <li
              key={w.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-slate-900 transition hover:bg-slate-50"
              onMouseDown={() => handleSelect(w)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                {getInitials(w.nombre) || <User className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{w.nombre}</p>
                <p className="truncate text-xs text-slate-400">{getWorkerSubtitle(w)}</p>
              </div>
              {w.id === Number(selectedId) && (
                <Check className="h-4 w-4 text-emerald-600" />
              )}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-sm text-slate-500">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}
