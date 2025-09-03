import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format, isValid } from 'date-fns';

export default function ExternoModal({ isOpen, onClose, fecha, onSave, initialCantidad = 0 }) {
  const [cantidad, setCantidad] = useState(initialCantidad);

  useEffect(() => {
    setCantidad(initialCantidad);
  }, [initialCantidad]);

  let formattedDate = 'Fecha inválida';
  if (fecha && isValid(new Date(fecha))) {
    formattedDate = format(new Date(fecha), 'dd/MM/yyyy');
  }

  const handleSave = () => {
    onSave({ fecha, cantidad: Number(cantidad) });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black/40">
        <Dialog.Panel className="w-full max-w-md rounded-lg shadow-lg p-6 bg-white text-black">
          <Dialog.Title className="text-lg font-bold mb-2">Externos</Dialog.Title>
          <p className="text-sm mb-4">Fecha: {formattedDate}</p>
          <input
            type="number"
            min="0"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="border p-2 rounded w-full text-black"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
