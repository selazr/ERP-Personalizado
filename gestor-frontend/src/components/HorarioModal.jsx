import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { format, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { CalendarDays, Clock, CreditCard, Folder, Plus, RotateCcw, Save, Trash2, Users, X } from 'lucide-react';
import WorkerAutocomplete from '@/components/WorkerAutocomplete';
import { calculateHourBreakdown, formatHoursToHM, PAYMENT_TYPE_LABELS } from '@/utils/utils';

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
  initialPagada = false,
  initialPaidType = null,
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
  const [isPaid, setIsPaid] = useState(false);
  const [paidType, setPaidType] = useState(null);

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
    setIsPaid(initialPagada);
    const normalizedInitialPaidType = initialPaidType ? String(initialPaidType).toLowerCase() : null;
    setPaidType(initialPagada ? normalizedInitialPaidType : null);

    // ✅ Detectar el proyecto si todos los intervalos tienen el mismo nombre
    if (initialData.length > 0 && initialData.every(i => i.proyecto_nombre === initialData[0].proyecto_nombre)) {
      setProyectoNombre(initialData[0].proyecto_nombre || '');
      setEditarProyecto(!!initialData[0].proyecto_nombre); // si hay nombre, activar checkbox
    } else {
      setProyectoNombre('');
      setEditarProyecto(false);
    }
  }, [
    initialData,
    initialFestivo,
    initialVacaciones,
    initialBaja,
    fecha,
    initialHoraNegativa,
    initialDiaNegativo,
    initialPagada,
    initialPaidType
  ]);


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

  const totalHoras = useMemo(() => {
    return intervals.reduce((sum, intv) => {
      if (intv.hora_inicio && intv.hora_fin) {
        const [h1, m1] = intv.hora_inicio.split(':').map(Number);
        const [h2, m2] = intv.hora_fin.split(':').map(Number);
        return sum + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
      }
      return sum;
    }, 0);
  }, [intervals]);

  const hoursByType = useMemo(() => {
    if (!fecha) {
      return { normales: 0, extras: 0, nocturnas: 0, festivas: 0 };
    }
    const breakdown = calculateHourBreakdown(intervals, fecha, {
      isHoliday,
      isVacation,
      isBaja,
    });
    const negativeForExtras = useNegative ? Math.max(parseHoursInput(negativeHours), 0) : 0;
    return {
      normales: breakdown.normales,
      extras: Math.max(breakdown.extras - negativeForExtras, 0),
      nocturnas: breakdown.nocturnas,
      festivas: breakdown.festivas,
    };
  }, [intervals, fecha, isHoliday, isVacation, isBaja, useNegative, negativeHours]);

  const paymentOptions = useMemo(
    () => Object.entries(hoursByType).filter(([, value]) => value > 0),
    [hoursByType]
  );

  const canMarkPaid = paymentOptions.length > 0;
  const selectedPaidHours = paidType ? Math.max(hoursByType[paidType] || 0, 0) : 0;
  const formattedPaidHours = formatHoursToHM(selectedPaidHours);
  const selectedPaidLabel = paidType ? PAYMENT_TYPE_LABELS[paidType] || paidType : null;

  useEffect(() => {
    if (isPaid) {
      if (!canMarkPaid) {
        setIsPaid(false);
        setPaidType(null);
      } else if (!paidType || (hoursByType[paidType] || 0) <= 0) {
        const defaultType = paymentOptions[0]?.[0] || null;
        setPaidType(defaultType);
      }
    }
  }, [isPaid, paidType, paymentOptions, canMarkPaid, hoursByType]);

  const handlePaidChange = (event) => {
    const checked = event.target.checked;
    if (checked) {
      if (!canMarkPaid) {
        return;
      }
      const defaultType = paidType && (hoursByType[paidType] || 0) > 0 ? paidType : paymentOptions[0]?.[0] || null;
      setPaidType(defaultType);
      setIsPaid(true);
    } else {
      setIsPaid(false);
      setPaidType(null);
    }
  };

  const handleSave = () => {
    const parsedNegative = useNegative ? parseHoursInput(negativeHours) : 0;
    const shouldMarkPaid = isPaid && paidType && selectedPaidHours > 0;
    onSave({
      fecha,
      intervals,
      festivo: isHoliday,
      vacaciones: isVacation,
      bajamedica: isBaja,
      proyecto_nombre: proyectoNombre?.trim() || null,
      horaNegativa: parsedNegative,
      diaNegativo: useNegative && parsedNegative === 0,
      pagada: shouldMarkPaid,
      horasPagadas: shouldMarkPaid ? selectedPaidHours : 0,
      tipoPagadas: shouldMarkPaid ? paidType : null,
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
    setIsPaid(false);
    setPaidType(null);
  };

  let formattedDate = 'Fecha inválida';
  if (fecha && isValid(new Date(fecha))) {
    formattedDate = format(new Date(fecha), 'dd/MM/yyyy');
  }

  const modalTone = isBaja
    ? {
        label: 'Baja médica',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-700 ring-red-200',
      }
    : isVacation
    ? {
        label: 'Vacaciones',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      }
    : isHoliday
    ? {
        label: 'Festivo',
        border: 'border-violet-200',
        badge: 'bg-violet-50 text-violet-700 ring-violet-200',
      }
    : {
        label: 'Jornada',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700 ring-slate-200',
      };

  const sectionClass = 'rounded-xl border border-slate-200 bg-white p-4';
  const sectionTitleClass = 'flex items-center gap-2 text-sm font-semibold text-slate-800';
  const inputClass = 'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition [color-scheme:light] placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200';
  const checkboxClass = 'h-4 w-4 rounded border-slate-300 accent-slate-900';

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
        <Dialog.Panel className={`w-full max-w-xl overflow-hidden rounded-2xl border ${modalTone.border} bg-slate-50 text-slate-900 shadow-xl shadow-slate-950/20 transition-colors duration-300`}>
          <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${modalTone.badge}`}>
                    {modalTone.label}
                  </span>
                  {isPaid && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      Pagada
                    </span>
                  )}
                </div>
                <Dialog.Title className="text-2xl font-bold tracking-tight text-slate-950">
                  Gestionar horas
                </Dialog.Title>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  {formattedDate}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{formatHoursToHM(totalHoras)}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[72vh] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <section className={sectionClass}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className={sectionTitleClass}>
                  <Clock className="h-4 w-4 text-slate-500" />
                  Intervalos
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {intervals.length} tramo{intervals.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
            {intervals.map((intv) => (
              <div key={intv.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 p-2">
                <input
                  type="time"
                  lang="es"
                  value={intv.hora_inicio}
                  onChange={(e) => handleChange(intv.id, 'hora_inicio', e.target.value)}
                  className={inputClass}
                />
                <span className="text-slate-400">-</span>
                <input
                  type="time"
                  lang="es"
                  value={intv.hora_fin}
                  onChange={(e) => handleChange(intv.id, 'hora_fin', e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(intv.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar intervalo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddInterval}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              Añadir intervalo
            </button>
              </div>
            </section>

            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>
                <CalendarDays className="h-4 w-4 text-slate-500" />
                Estado del día
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={useNegative}
                    onChange={(e) => setUseNegative(e.target.checked)}
                    className={checkboxClass}
                  />
                  Registrar horas negativas
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className={checkboxClass}
                  />
                  Festivo
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isVacation}
                    onChange={(e) => setIsVacation(e.target.checked)}
                    className={checkboxClass}
                  />
                  Vacaciones
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isBaja}
                    onChange={(e) => setIsBaja(e.target.checked)}
                    className={checkboxClass}
                  />
                  Baja médica
                </label>
              </div>

              {useNegative && (
                <input
                  type="text"
                  value={negativeHours}
                  onChange={(e) => setNegativeHours(e.target.value)}
                  placeholder="Horas negativas (HH,MM)"
                  className={`${inputClass} mt-3 w-full`}
                />
              )}
            </section>

            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>
                <CreditCard className="h-4 w-4 text-slate-500" />
                Pago
              </h3>
              <label className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={handlePaidChange}
                  disabled={!canMarkPaid}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                />
                Marcar horas como pagadas
              </label>
              {!canMarkPaid && (
                <p className="mt-2 text-xs text-slate-500">
                  No hay horas disponibles que cumplan las condiciones para realizar el pago.
                </p>
              )}
              {isPaid && (
                <div className="mt-3 space-y-2">
                  <select
                    value={paidType || ''}
                    onChange={(e) => setPaidType(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    {paymentOptions.map(([key, value]) => (
                      <option key={key} value={key}>
                        {`${PAYMENT_TYPE_LABELS[key] || key} (${formatHoursToHM(value)})`}
                      </option>
                    ))}
                  </select>
                  {selectedPaidLabel && selectedPaidHours > 0 ? (
                    <p className="text-sm text-emerald-700">
                      Se pagarán {formattedPaidHours} de horas {selectedPaidLabel.toLowerCase()}.
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-700">
                      Selecciona un tipo de horas para realizar el pago.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>
                <Folder className="h-4 w-4 text-slate-500" />
                Proyecto
              </h3>
              <label className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editarProyecto}
                  onChange={(e) => {
                    setEditarProyecto(e.target.checked);
                    if (!e.target.checked) setProyectoNombre(null); // Limpia si se desmarca
                  }}
                  className={checkboxClass}
                />
                Asignar a un proyecto
              </label>
              {editarProyecto && (
                <input
                  type="text"
                  value={proyectoNombre ?? ''}
                  onChange={(e) => setProyectoNombre(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className={`${inputClass} mt-3 w-full`}
                />
              )}
            </section>

            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>
                <Users className="h-4 w-4 text-slate-500" />
                Aplicar a más trabajadores
              </h3>
              {extraWorkers.map((w, idx) => (
                <div key={idx} className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <WorkerAutocomplete
                    workers={workers}
                    selectedId={w}
                    onChange={(id) => changeWorker(idx, id)}
                  />
                  <button
                    type="button"
                    onClick={() => removeWorker(idx)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    title="Quitar trabajador"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addWorker}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                <Plus className="h-4 w-4" />
                Agregar trabajador
              </button>
            </section>

            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>
                <CalendarDays className="h-4 w-4 text-slate-500" />
                Aplicar a más días
              </h3>
              {extraDates.map((d, idx) => (
                <div key={idx} className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <input
                    type="date"
                    value={d}
                    onChange={(e) => changeDate(idx, e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                  <button
                    type="button"
                    onClick={() => removeDate(idx)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    title="Quitar día"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDate}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                <Plus className="h-4 w-4" />
                Agregar día
              </button>
            </section>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar día
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Save className="h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
