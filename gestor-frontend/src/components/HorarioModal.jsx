import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function HorarioModal({ isOpen, onClose, fecha, onSave, initialData = [], initialFestivo = false }) {
  const [intervals, setIntervals] = useState([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [proyectoNombre, setProyectoNombre] = useState(null);
  const [editarProyecto, setEditarProyecto] = useState(false);
  
  useEffect(() => {
  setIntervals(initialData.map(item => ({ ...item, id: uuidv4() })));
  setIsHoliday(initialFestivo);

  // ✅ Detectar el proyecto si todos los intervalos tienen el mismo nombre
  if (initialData.length > 0 && initialData.every(i => i.proyecto_nombre === initialData[0].proyecto_nombre)) {
    setProyectoNombre(initialData[0].proyecto_nombre || '');
    setEditarProyecto(!!initialData[0].proyecto_nombre); // si hay nombre, activar checkbox
  } else {
    setProyectoNombre('');
    setEditarProyecto(false);
  }
}, [initialData, initialFestivo, fecha]);


  const handleAddInterval = () => {
    setIntervals([...intervals, { id: uuidv4(), hora_inicio: '', hora_fin: '' }]);
  };

  const handleChange = (id, field, value) => {
    setIntervals(prev => prev.map(intv => intv.id === id ? { ...intv, [field]: value } : intv));
  };

  const handleRemove = (id) => {
    setIntervals(prev => prev.filter(intv => intv.id !== id));
  };

  const handleSave = () => {
    onSave({
      fecha,
      intervals,
      festivo: isHoliday,
      proyecto_nombre: proyectoNombre?.trim() || null
    });
    onClose();
  };

  const handleClear = () => {
    setIntervals([]);
    setIsHoliday(false);
    setProyectoNombre(null);
    setEditarProyecto(false);
  };

  const totalHoras = intervals.reduce((sum, intv) => {
    if (intv.hora_inicio && intv.hora_fin) {
      const [h1, m1] = intv.hora_inicio.split(':').map(Number);
      const [h2, m2] = intv.hora_fin.split(':').map(Number);
      return sum + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    }
    return sum;
  }, 0);

  let formattedDate = 'Fecha inválida';
  if (fecha && isValid(new Date(fecha))) {
    formattedDate = format(new Date(fecha), 'dd/MM/yyyy');
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black/40">
          <Dialog.Panel className={`w-full max-w-md rounded-lg shadow-lg p-6 transition-colors duration-300 ${
            isHoliday ? 'bg-purple-50 text-purple-900' : 'bg-white text-black'
          }`}>
          <Dialog.Title className="text-lg font-bold mb-2">Gestionar Horas</Dialog.Title>
          <p className="text-sm mb-4">
            Ajusta los intervalos horarios para el día {formattedDate}. Total: <strong>{totalHoras.toFixed(1)}h</strong>
          </p>

          <div className="space-y-2">
            {intervals.map((intv, i) => (
              <div key={intv.id} className="flex gap-2 items-center">
                <input
                  type="time"
                  value={intv.hora_inicio}
                  onChange={(e) => handleChange(intv.id, 'hora_inicio', e.target.value)}
                  className="border p-1 rounded w-full text-black"
                />
                <span>-</span>
                <input
                  type="time"
                  value={intv.hora_fin}
                  onChange={(e) => handleChange(intv.id, 'hora_fin', e.target.value)}
                  className="border p-1 rounded w-full text-black"
                />
                <button onClick={() => handleRemove(intv.id)} className="text-red-500">&#x2716;</button>
              </div>
            ))}

            <button onClick={handleAddInterval} className="w-full border-dashed border p-2 text-center rounded hover:bg-gray-100">
              + Añadir Intervalo
            </button>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={isHoliday}
                onChange={(e) => setIsHoliday(e.target.checked)}
              />
              Marcar como Festivo (para este trabajador)
            </label>

            <label className="flex flex-col gap-2 mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editarProyecto}
                  onChange={(e) => {
                    setEditarProyecto(e.target.checked);
                    if (!e.target.checked) setProyectoNombre(null); // Limpia si se desmarca
                  }}
                />
                Asignar a un proyecto
              </div>

              {editarProyecto && (
                <input
                  type="text"
                  value={proyectoNombre ?? ''}
                  onChange={(e) => setProyectoNombre(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className="p-2 border border-gray-300 rounded"
                />
              )}
            </label>  

          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={handleClear} className="bg-red-500 text-white px-3 py-1 rounded">Limpiar Día</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="border px-3 py-1 rounded">Cancelar</button>
              <button onClick={handleSave} className="bg-purple-500 text-white px-3 py-1 rounded">Guardar Cambios</button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
