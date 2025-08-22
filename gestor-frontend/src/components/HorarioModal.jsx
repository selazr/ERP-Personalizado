import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import WorkerAutocomplete from '@/components/WorkerAutocomplete';

export default function HorarioModal({
  isOpen,
  onClose,
  fecha,
  onSave,
  initialData = [],
  initialFestivo = false,
  initialVacaciones = false,
  initialBaja = false,
  initialHoraNegativa = 0,
  initialDiaNegativo = false,
  workers = []
}) {
  const [intervals, setIntervals] = useState([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [isVacation, setIsVacation] = useState(false);
  const [isBaja, setIsBaja] = useState(false);
  const [proyectoNombre, setProyectoNombre] = useState(null);
  const [editarProyecto, setEditarProyecto] = useState(false);
  const [extraWorkers, setExtraWorkers] = useState([]);
  const [extraDates, setExtraDates] = useState([]);
  const [useNegative, setUseNegative] = useState(false);
  const [negativeHours, setNegativeHours] = useState('');

  const parseHoursInput = (val) => {
    if (!val) return 0;
    const normalized = val.replace(',', '.');
    const sign = normalized.trim().startsWith('-') ? -1 : 1;
    const unsigned = normalized.replace('-', '');
    const [hPart, mPart = '0'] = unsigned.split('.');
    const hours = parseInt(hPart, 10) || 0;
    let minutes = parseInt(mPart, 10) || 0;
    if (mPart.length === 1) minutes *= 6;
    if (minutes > 59) minutes = 59;
    return sign * (hours + minutes / 60);
  };

  const formatHoursInput = (val) => {
    const sign = val < 0 ? '-' : '';
    const absVal = Math.abs(val);
    let hours = Math.floor(absVal);
    let minutes = Math.round((absVal - hours) * 60);
    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }
    return `${sign}${hours},${minutes.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    setIntervals(initialData.map(item => ({ ...item, id: uuidv4() })));
    setIsHoliday(initialFestivo);
    setIsVacation(initialVacaciones);
    setIsBaja(initialBaja);
    setUseNegative(initialHoraNegativa > 0 || initialDiaNegativo);
    setNegativeHours(initialHoraNegativa ? formatHoursInput(initialHoraNegativa) : '');

  // ✅ Detectar el proyecto si todos los intervalos tienen el mismo nombre
  if (initialData.length > 0 && initialData.every(i => i.proyecto_nombre === initialData[0].proyecto_nombre)) {
    setProyectoNombre(initialData[0].proyecto_nombre || '');
    setEditarProyecto(!!initialData[0].proyecto_nombre); // si hay nombre, activar checkbox
  } else {
    setProyectoNombre('');
    setEditarProyecto(false);
  }
  }, [initialData, initialFestivo, initialVacaciones, initialBaja, fecha, initialHoraNegativa, initialDiaNegativo]);


  const handleAddInterval = () => {
    setIntervals([...intervals, { id: uuidv4(), hora_inicio: '', hora_fin: '' }]);
  };

  const handleChange = (id, field, value) => {
    setIntervals(prev => prev.map(intv => intv.id === id ? { ...intv, [field]: value } : intv));
  };

  const handleRemove = (id) => {
    setIntervals(prev => prev.filter(intv => intv.id !== id));
  };

  const addWorker = () => {
    setExtraWorkers(prev => [...prev, '']);
  };

  const changeWorker = (index, value) => {
    setExtraWorkers(prev => prev.map((w, i) => i === index ? value : w));
  };

  const removeWorker = (index) => {
    setExtraWorkers(prev => prev.filter((_, i) => i !== index));
  };

  const addDate = () => {
    setExtraDates(prev => [...prev, fecha]);
  };

  const changeDate = (index, value) => {
    setExtraDates(prev => prev.map((d, i) => i === index ? value : d));
  };

  const removeDate = (index) => {
    setExtraDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const parsedNegative = useNegative ? parseHoursInput(negativeHours) : 0;
    onSave({
      fecha,
      intervals,
      festivo: isHoliday,
      vacaciones: isVacation,
      bajamedica: isBaja,
      proyecto_nombre: proyectoNombre?.trim() || null,
      horaNegativa: parsedNegative,
      diaNegativo: useNegative && parsedNegative === 0,
      trabajadoresExtra: extraWorkers.filter(Boolean),
      fechasExtra: extraDates.filter(Boolean)
    });
    onClose();
  };

  const handleClear = () => {
    setIntervals([]);
    setIsHoliday(false);
    setIsVacation(false);
    setIsBaja(false);
    setProyectoNombre(null);
    setEditarProyecto(false);
    setExtraWorkers([]);
    setExtraDates([]);
    setUseNegative(false);
    setNegativeHours('');
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
            isBaja
              ? 'bg-red-50 text-red-900'
              : isVacation
              ? 'bg-green-50 text-green-900'
              : isHoliday
              ? 'bg-purple-50 text-purple-900'
              : 'bg-white text-black'
          }`}>
          <Dialog.Title className="text-lg font-bold mb-2">Gestionar Horas</Dialog.Title>
          <p className="text-sm mb-4">
            Ajusta los intervalos horarios para el día {formattedDate}. Total: <strong>{totalHoras.toFixed(1)}h</strong>
          </p>

          <div className="space-y-2">
            {intervals.map((intv) => (
              <div key={intv.id} className="flex gap-2 items-center">
                <input
                  type="time"
                  lang="es"
                  value={intv.hora_inicio}
                  onChange={(e) => handleChange(intv.id, 'hora_inicio', e.target.value)}
                  className="border p-1 rounded w-full text-black"
                />
                <span>-</span>
                <input
                  type="time"
                  lang="es"
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
                checked={useNegative}
                onChange={(e) => setUseNegative(e.target.checked)}
              />
              Registrar horas negativas
            </label>

            {useNegative && (
              <input
                type="text"
                value={negativeHours}
                onChange={(e) => setNegativeHours(e.target.value)}
                placeholder="Horas negativas (HH,MM)"
                className="p-2 border border-gray-300 rounded w-full mt-1"
              />
            )}

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={isHoliday}
                onChange={(e) => setIsHoliday(e.target.checked)}
              />
              Marcar como Festivo (para este trabajador)
            </label>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={isVacation}
                onChange={(e) => setIsVacation(e.target.checked)}
              />
              Marcar como Vacaciones (para este trabajador)
            </label>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={isBaja}
                onChange={(e) => setIsBaja(e.target.checked)}
              />
              Marcar como Baja Médica
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

            <div className="mt-4">
              <h3 className="font-medium">Asignar a más trabajadores</h3>
              {extraWorkers.map((w, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2">
                  <WorkerAutocomplete
                    workers={workers}
                    selectedId={w}
                    onChange={(id) => changeWorker(idx, id)}
                  />
                  <button
                    type="button"
                    onClick={() => removeWorker(idx)}
                    className="text-red-500"
                  >
                    &#x2716;
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addWorker}
                className="w-full border-dashed border p-2 text-center rounded hover:bg-gray-100 mt-2"
              >
                + Agregar Trabajador
              </button>
            </div>

            <div className="mt-4">
              <h3 className="font-medium">Aplicar a más días</h3>
              {extraDates.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2">
                  <input
                    type="date"
                    value={d}
                    onChange={(e) => changeDate(idx, e.target.value)}
                    className="border p-1 rounded w-full text-black"
                  />
                  <button
                    type="button"
                    onClick={() => removeDate(idx)}
                    className="text-red-500"
                  >
                    &#x2716;
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDate}
                className="w-full border-dashed border p-2 text-center rounded hover:bg-gray-100 mt-2"
              >
                + Agregar Día
              </button>
            </div>

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
