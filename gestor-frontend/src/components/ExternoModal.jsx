import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { format, isValid } from 'date-fns';

export default function ExternoModal({
  isOpen,
  onClose,
  fecha,
  onSave,
  initialItems = [],
  companies = [],
}) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  let formattedDate = 'Fecha inválida';
  if (fecha && isValid(new Date(fecha))) {
    formattedDate = format(new Date(fecha), 'dd/MM/yyyy');
  }

  const handleChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAdd = () => {
    setItems((prev) => [
      ...prev,
      { nombre_empresa_externo: '', cantidad: 0 },
    ]);
  };

  const handleRemove = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ fecha, items });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black/40">
        <Dialog.Panel className="w-full max-w-md rounded-lg shadow-lg p-6 bg-white text-black">
          <Dialog.Title className="text-lg font-bold mb-2">Externos</Dialog.Title>
          <p className="text-sm mb-4">Fecha: {formattedDate}</p>

          {items.map((item, index) => {
            const listId = `companies-${index}`;
            return (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  list={listId}
                  value={item.nombre_empresa_externo}
                  onChange={(e) =>
                    handleChange(index, 'nombre_empresa_externo', e.target.value)
                  }
                  className="border p-2 rounded text-black flex-1"
                  placeholder="Empresa"
                />
                <datalist id={listId}>
                  {companies.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <input
                  type="number"
                  min="0"
                  value={item.cantidad}
                  onChange={(e) =>
                    handleChange(index, 'cantidad', e.target.value)
                  }
                  className="border p-2 rounded w-24 text-black"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-red-600 px-2"
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
          >
            Añadir
          </button>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

