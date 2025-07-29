import React, { useState, useEffect } from 'react';

export default function WorkerAutocomplete({ workers = [], selectedId, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const selected = workers.find(w => w.id === Number(selectedId));
    if (selected) {
      setQuery(selected.nombre);
    }
  }, [selectedId, workers]);

  const filtered = workers.filter(w => w.nombre.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (worker) => {
    onChange(worker.id);
    setQuery(worker.nombre);
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-64">
      <input
        type="text"
        className="w-full p-3 text-base border border-gray-300 rounded bg-white shadow-sm text-black"
        placeholder="Buscar trabajador..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      />
      {open && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow mt-1 max-h-60 overflow-y-auto">
          {filtered.map((w) => (
            <li
              key={w.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
              onMouseDown={() => handleSelect(w)}
            >
              {w.nombre}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-gray-500">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}
