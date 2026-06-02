import React, { useEffect, useState, useRef } from 'react';
import { format, startOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import HorarioModal from '@/components/HorarioModal';
import FestivosGlobalModal from '@/components/FestivosGlobalModal';
import WorkerAutocomplete from '@/components/WorkerAutocomplete';
import { HoursSummary } from '@/components/HorasResumen';
import { YearHoursSummary } from '@/components/HorasResumenAnual';
import { ChevronLeft, ChevronRight, Settings, Folder, Download, Copy, Clipboard } from 'lucide-react';
import {
  exportScheduleToExcel,
  exportAllSchedulesToExcel,
  exportYearScheduleToExcel
} from '@/utils/exportExcel';
import {
  formatHoursToHM,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_MESSAGE_LABELS
} from '@/utils/utils';
import { apiUrl } from '@/utils/api';
import apiClient from '@/utils/apiClient';
import { useEmpresa } from '@/context/EmpresaContext';

export default function ScheduleManager() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFestivosModalOpen, setIsFestivosModalOpen] = useState(false);
  const [copiedWeek, setCopiedWeek] = useState(null);
  const [copiedDay, setCopiedDay] = useState(null); // <- NUEVO ESTADO PARA EL DÍA COPIADO
  const [globalHolidays, setGlobalHolidays] = useState([]);
  const { empresaId, isAutonomo, autonomoId } = useEmpresa();
  const monthInputRef = useRef(null);

  const handleMonthLabelClick = () => {
    if (monthInputRef.current) {
      if (typeof monthInputRef.current.showPicker === 'function') {
        monthInputRef.current.showPicker();
      } else {
        monthInputRef.current.click();
      }
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = startOfMonth(currentDate);
  const firstDayIndex = (getDay(firstDay) + 6) % 7;

  const agruparHorarios = (horarios) => {
    const result = {};
    horarios.forEach(({
      fecha,
      hora_inicio,
      hora_fin,
      festivo,
      vacaciones,
      bajamedica,
      proyecto_nombre,
      horanegativa,
      dianegativo,
      pagada,
      horas_pagadas,
      tipo_horas_pagadas
    }) => {
      if (!result[fecha]) {
        result[fecha] = {
          intervals: [],
          isHoliday: false,
          isVacation: false,
          isBaja: false,
          horaNegativa: 0,
          diaNegativo: false,
          pagada: false,
          horasPagadas: 0,
          tipoPagadas: null
        };
      }
      const horasPagadasValue = horas_pagadas ? parseFloat(horas_pagadas) : 0;
      const tipoHorasPagadas = tipo_horas_pagadas ? String(tipo_horas_pagadas).toLowerCase() : null;
      result[fecha].intervals.push({
        hora_inicio,
        hora_fin,
        proyecto_nombre,
        pagada: !!pagada,
        horas_pagadas: horasPagadasValue,
        tipo_horas_pagadas: tipoHorasPagadas
      });
      if (festivo) result[fecha].isHoliday = true;
      if (vacaciones) result[fecha].isVacation = true;
      if (bajamedica) result[fecha].isBaja = true;
      if (horanegativa) result[fecha].horaNegativa = horanegativa;
      if (dianegativo) result[fecha].diaNegativo = true;
      if (pagada) {
        result[fecha].pagada = true;
        if (tipoHorasPagadas && !result[fecha].tipoPagadas) {
          result[fecha].tipoPagadas = tipoHorasPagadas;
        }
      }
      if (typeof horasPagadasValue === 'number' && !Number.isNaN(horasPagadasValue)) {
        result[fecha].horasPagadas = Math.max(result[fecha].horasPagadas, horasPagadasValue);
      }
    });
    return result;
  };

  const getPaidLabel = (type) => {
    if (!type) return 'Pagada';
    const normalized = type.toLowerCase();
    const label =
      PAYMENT_TYPE_MESSAGE_LABELS[normalized] ||
      PAYMENT_TYPE_LABELS[normalized] ||
      normalized;
    return `Pagada ${label}`;
  };

  const getFechaKey = (day) => format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');

  const handleDayClick = (day) => {
    const fecha = getFechaKey(day);
    const grouped = groupedData[fecha] || {};
    const eventos = grouped.intervals || [];
    const isHoliday = grouped.isHoliday || false;
    const isVacation = grouped.isVacation || false;
    const isBaja = grouped.isBaja || false;
    const horaNegativa = grouped.horaNegativa || 0;
    const diaNegativo = grouped.diaNegativo || false;
    const pagada = grouped.pagada || false;
    const horasPagadas = grouped.horasPagadas || 0;
    const tipoPagadas = grouped.tipoPagadas || null;

    setSelectedDay({
      fecha,
      eventos,
      isHoliday,
      isVacation,
      isBaja,
      horaNegativa,
      diaNegativo,
      pagada,
      horasPagadas,
      tipoPagadas,
    });
    setIsModalOpen(true);
  };

  const handleGuardarHorarios = ({
    fecha,
    intervals,
    festivo,
    vacaciones,
    bajamedica,
    proyecto_nombre,
    horaNegativa = 0,
    diaNegativo = false,
    pagada = false,
    horasPagadas = 0,
    tipoPagadas = null,
    trabajadoresExtra = [],
    fechasExtra = []
  }) => {
    const workerIds = [selectedTrabajadorId, ...trabajadoresExtra];
    const fechas = [fecha, ...fechasExtra];

    const requests = [];
    workerIds.forEach(wid => {
      fechas.forEach(f => {
        requests.push(
          apiClient.post(
            apiUrl('horarios'),
            {
              trabajador_id: wid,
              fecha: f,
              horarios: intervals,
              festivo,
              vacaciones,
              bajamedica,
              proyecto_nombre,
              horanegativa: horaNegativa,
              dianegativo: diaNegativo,
              pagada,
              horas_pagadas: horasPagadas,
              tipo_horas_pagadas: tipoPagadas
            }
          )
        );
      });
    });

    Promise.all(requests).then(() => {
      apiClient
        .get(apiUrl(`horarios/${selectedTrabajadorId}`))
        .then(res => {
          setScheduleData(res.data);
        });
    });
  };

  const handleGuardarFestivosGlobales = async (nuevasFechas) => {
    const fechasEliminadas = globalHolidays.filter((f) => !nuevasFechas.includes(f));
    const fechasAgregadas = nuevasFechas.filter((f) => !globalHolidays.includes(f));

    const requests = [];

    // Agregar festivos nuevos
    fechasAgregadas.forEach((fecha) => {
      trabajadores.forEach((trabajador) => {
        requests.push(
          apiClient.post(apiUrl('horarios'), {
            trabajador_id: trabajador.id,
            fecha,
            horarios: [],
            festivo: true,
            vacaciones: false,
            bajamedica: false,
            proyecto_nombre: null,
            horanegativa: 0,
            dianegativo: false,
            pagada: false,
            horas_pagadas: 0,
            tipo_horas_pagadas: null,
          })
        );
      });
    });

    // Eliminar festivos descartados (seteando festivo: false)
    fechasEliminadas.forEach((fecha) => {
      trabajadores.forEach((trabajador) => {
        requests.push(
          apiClient.post(apiUrl('horarios'), {
            trabajador_id: trabajador.id,
            fecha,
            horarios: [],
            festivo: false,
            vacaciones: false,
            bajamedica: false,
            proyecto_nombre: null,
            horanegativa: 0,
            dianegativo: false,
            pagada: false,
            horas_pagadas: 0,
            tipo_horas_pagadas: null,
          })
        );
      });
    });

    await Promise.all(requests);

    const storageKey = empresaId
      ? `global_holidays_empresa_${empresaId}`
      : autonomoId
      ? `global_holidays_autonomo_${autonomoId}`
      : 'global_holidays';
    localStorage.setItem(storageKey, JSON.stringify(nuevasFechas));
    setGlobalHolidays(nuevasFechas);

    if (selectedTrabajadorId) {
      const res = await apiClient.get(apiUrl(`horarios/${selectedTrabajadorId}`));
      setScheduleData(res.data);
    }
  };

  const handleCopyDay = (e, dateKey) => {
    e.stopPropagation();
    const grouped = groupedData[dateKey] || {};
    const dayData = {
      intervals: grouped.intervals || [],
      festivo: grouped.isHoliday || false,
      vacaciones: grouped.isVacation || false,
      bajamedica: grouped.isBaja || false,
      proyecto_nombre: grouped.intervals?.[0]?.proyecto_nombre || '',
      horaNegativa: grouped.horaNegativa || 0,
      diaNegativo: grouped.diaNegativo || false,
      pagada: grouped.pagada || false,
      horasPagadas: grouped.horasPagadas || 0,
      tipoPagadas: grouped.tipoPagadas || null,
    };
    setCopiedDay(dayData);
  };

  const handlePasteDay = (e, targetDateKey) => {
    e.stopPropagation();
    if (!copiedDay || !selectedTrabajadorId) return;

    apiClient.post(
      apiUrl('horarios'),
      {
        trabajador_id: selectedTrabajadorId,
        fecha: targetDateKey,
        horarios: copiedDay.intervals,
        festivo: copiedDay.festivo,
        vacaciones: copiedDay.vacaciones,
        bajamedica: copiedDay.bajamedica,
        proyecto_nombre: copiedDay.proyecto_nombre || null,
        horanegativa: copiedDay.horaNegativa,
        dianegativo: copiedDay.diaNegativo,
        pagada: copiedDay.pagada,
        horas_pagadas: copiedDay.horasPagadas,
        tipo_horas_pagadas: copiedDay.tipoPagadas
      }
    )
      .then(() => {
        return apiClient.get(apiUrl(`horarios/${selectedTrabajadorId}`));
      })
      .then((res) => {
        setScheduleData(res.data);
      })
      .catch((err) => {
        console.error('Error al pegar el día:', err);
        alert('Hubo un error al pegar el horario del día.');
      });
  };

  const handleCopyWeek = (weekDateKeys) => {
    const weekData = weekDateKeys.map((dateKey) => {
      const grouped = groupedData[dateKey] || {};
      return {
        intervals: grouped.intervals || [],
        festivo: grouped.isHoliday || false,
        vacaciones: grouped.isVacation || false,
        bajamedica: grouped.isBaja || false,
        proyecto_nombre: grouped.intervals?.[0]?.proyecto_nombre || '',
        horaNegativa: grouped.horaNegativa || 0,
        diaNegativo: grouped.diaNegativo || false,
        pagada: grouped.pagada || false,
        horasPagadas: grouped.horasPagadas || 0,
        tipoPagadas: grouped.tipoPagadas || null,
      };
    });
    setCopiedWeek(weekData);
  };

  const handlePasteWeek = (targetDateKeys) => {
    if (!copiedWeek || copiedWeek.length !== 7 || !selectedTrabajadorId) return;

    const requests = targetDateKeys.map((dateKey, index) => {
      const sourceDay = copiedWeek[index];
      return apiClient.post(
        apiUrl('horarios'),
        {
          trabajador_id: selectedTrabajadorId,
          fecha: dateKey,
          horarios: sourceDay.intervals,
          festivo: sourceDay.festivo,
          vacaciones: sourceDay.vacaciones,
          bajamedica: sourceDay.bajamedica,
          proyecto_nombre: sourceDay.proyecto_nombre || null,
          horanegativa: sourceDay.horaNegativa,
          dianegativo: sourceDay.diaNegativo,
          pagada: sourceDay.pagada,
          horas_pagadas: sourceDay.horasPagadas,
          tipo_horas_pagadas: sourceDay.tipoPagadas
        }
      );
    });

    Promise.all(requests)
      .then(() => {
        return apiClient.get(apiUrl(`horarios/${selectedTrabajadorId}`));
      })
      .then((res) => {
        setScheduleData(res.data);
      })
      .catch((err) => {
        console.error('Error al pegar la semana:', err);
        alert('Hubo un error al pegar los horarios de la semana.');
      });
  };

  const handleDescargarPlantilla = async () => {
    try {
      const res = await apiClient.get(apiUrl(`horarios/${selectedTrabajadorId}`));
      const trabajador = trabajadores.find(t => t.id === Number(selectedTrabajadorId));
      if (trabajador) {
        exportScheduleToExcel(trabajador, res.data, currentDate);
      }
    } catch (err) {
      console.error('Error al generar Excel:', err);
      alert('No se pudo generar el archivo');
    }
  };

  const handleDescargarPlantillaAnual = async () => {
    try {
      const res = await apiClient.get(apiUrl(`horarios/${selectedTrabajadorId}`));
      const trabajador = trabajadores.find(
        t => t.id === Number(selectedTrabajadorId)
      );
      if (trabajador) {
        exportYearScheduleToExcel(trabajador, res.data, currentDate);
      }
    } catch (err) {
      console.error('Error al generar Excel:', err);
      alert('No se pudo generar el archivo');
    }
  };

  const handleDescargarTodasPlantillas = async () => {
    try {
      const requests = trabajadores.map((t) =>
        apiClient.get(apiUrl(`horarios/${t.id}`))
      );
      const responses = await Promise.all(requests);
      const items = trabajadores.map((t, idx) => ({ trabajador: t, horarios: responses[idx].data }));
      exportAllSchedulesToExcel(items, currentDate);
    } catch (err) {
      console.error('Error al generar Excel:', err);
      alert('No se pudo generar el archivo');
    }
  };

  useEffect(() => {
    if (!empresaId && !(isAutonomo && autonomoId)) return;
    const endpoint = isAutonomo ? 'trabajadores-autonomos' : 'trabajadores';
    apiClient.get(apiUrl(endpoint)).then(res => {
      setTrabajadores(res.data);
    });
  }, [empresaId, autonomoId, isAutonomo]);

  useEffect(() => {
    if (!trabajadores.length) {
      setSelectedTrabajadorId('');
      return;
    }

    const exists = trabajadores.some(t => t.id === Number(selectedTrabajadorId));
    if (!exists) {
      setSelectedTrabajadorId(trabajadores[0].id);
    }
  }, [trabajadores, selectedTrabajadorId]);

  useEffect(() => {
    if (!selectedTrabajadorId) return;
    apiClient.get(apiUrl(`horarios/${selectedTrabajadorId}`)).then(res => {
      setScheduleData(res.data);
    });
  }, [selectedTrabajadorId, currentDate, empresaId, autonomoId, isAutonomo, trabajadores]);

  useEffect(() => {
    setSelectedTrabajadorId('');
    setScheduleData([]);
    setSelectedDay(null);
  }, [empresaId, autonomoId, isAutonomo]);

  useEffect(() => {
    const storageKey = empresaId
      ? `global_holidays_empresa_${empresaId}`
      : autonomoId
      ? `global_holidays_autonomo_${autonomoId}`
      : 'global_holidays';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setGlobalHolidays(JSON.parse(saved));
      } catch (e) {
        setGlobalHolidays([]);
      }
    } else {
      setGlobalHolidays([]);
    }
  }, [empresaId, autonomoId]);

  const groupedData = agruparHorarios(scheduleData);

  const renderCalendar = () => {
    const gridStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 - firstDayIndex);
    const elements = [];

    const numWeeks = Math.ceil((firstDayIndex + daysInMonth) / 7);

    for (let w = 0; w < numWeeks; w++) {
      const weekDateKeys = [];
      for (let i = 0; i < 7; i++) {
        const cellIndex = w * 7 + i;
        const date = new Date(gridStartDate.getFullYear(), gridStartDate.getMonth(), gridStartDate.getDate() + cellIndex);
        weekDateKeys.push(format(date, 'yyyy-MM-dd'));
      }

      elements.push(
        <div
          key={`action-week-${w}`}
          className="flex flex-col items-center justify-center gap-1 h-24 w-full bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm"
        >
          <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Sem {w + 1}</span>
          <button
            type="button"
            title="Copiar semana"
            onClick={() => handleCopyWeek(weekDateKeys)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Pegar semana"
            disabled={!copiedWeek}
            onClick={() => handlePasteWeek(weekDateKeys)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition disabled:opacity-30 disabled:pointer-events-none"
          >
            <Clipboard className="w-4 h-4" />
          </button>
        </div>
      );

      for (let i = 0; i < 7; i++) {
        const cellIndex = w * 7 + i;
        const date = new Date(gridStartDate.getFullYear(), gridStartDate.getMonth(), gridStartDate.getDate() + cellIndex);
        const day = date.getDate();
        const dateKey = weekDateKeys[i];

        const isCurrentMonth = date.getMonth() === currentDate.getMonth();

        if (!isCurrentMonth) {
          elements.push(
            <div key={`empty-${cellIndex}`} className="border rounded-lg h-24 w-full p-2 bg-slate-50/50 text-gray-300 flex items-center justify-center text-xs font-semibold relative">
              <span className="absolute top-1 left-1 text-xs font-semibold text-gray-300">{day}</span>
            </div>
          );
        } else {
          const grouped = groupedData[dateKey];
          const eventos = grouped?.intervals || [];
          const festivo = grouped?.isHoliday || false;
          const vacaciones = grouped?.isVacation || false;
          const bajamedica = grouped?.isBaja || false;
          const horaNegativa = grouped?.horaNegativa || 0;
          const diaNegativo = grouped?.diaNegativo || false;
          const pagada = grouped?.pagada || false;
          const horasPagadasRaw = grouped?.horasPagadas || 0;
          const horasPagadas =
            typeof horasPagadasRaw === 'number'
              ? horasPagadasRaw
              : parseFloat(horasPagadasRaw) || 0;
          const tipoPagadas = grouped?.tipoPagadas || null;
          const weekend = date.getDay() === 6 || date.getDay() === 0;

          const paidLabel = getPaidLabel(tipoPagadas);
          const paidAmountLabel = horasPagadas > 0 ? formatHoursToHM(horasPagadas) : null;
          const paidDisplay = paidAmountLabel ? `${paidLabel} · ${paidAmountLabel}` : paidLabel;

          const totalHoras = eventos.reduce((sum, ev) => {
            if (!ev.hora_inicio || !ev.hora_fin) return sum;
            const [h1, m1] = ev.hora_inicio.split(':').map(Number);
            const [h2, m2] = ev.hora_fin.split(':').map(Number);
            return sum + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
          }, 0);


          elements.push(
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                group cursor-pointer border rounded-lg h-24 w-full p-2 text-sm font-medium flex flex-col items-center justify-center relative transition-all duration-200
                ${bajamedica ? 'bg-red-100 text-red-700' : ''}
                ${festivo ? 'bg-purple-100 text-purple-700' : ''}
                ${vacaciones ? 'bg-green-100 text-green-700' : ''}
                ${diaNegativo || horaNegativa > 0 ? 'bg-red-200 text-red-700' : ''}
                ${pagada ? 'border-2 border-emerald-400' : ''}
                ${totalHoras > 0 && !festivo && !vacaciones && !bajamedica && horaNegativa <= 0 && !diaNegativo ? 'bg-blue-100 text-blue-700' : ''}
                ${weekend && !festivo && !vacaciones && !bajamedica && totalHoras === 0 ? 'bg-gray-100 text-gray-400' : ''}
                hover:shadow-md
              `}
            >
              <span className="absolute top-1 left-1 text-xs font-semibold text-gray-500">{day}</span>

              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                <button
                  type="button"
                  title="Copiar día"
                  onClick={(e) => handleCopyDay(e, dateKey)}
                  className="p-1 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded shadow-sm transition"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Pegar día"
                  disabled={!copiedDay}
                  onClick={(e) => handlePasteDay(e, dateKey)}
                  className="p-1 bg-white border border-slate-200 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded shadow-sm transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Clipboard className="w-3 h-3" />
                </button>
              </div>

              {bajamedica && (
                <span className="text-xs font-semibold mt-2">Baja</span>
              )}
              {festivo && !bajamedica && (
                <span className="text-xs font-semibold mt-2">Festivo</span>
              )}
              {vacaciones && !festivo && !bajamedica && (
                <span className="text-xs font-semibold mt-2">Vacaciones</span>
              )}

              {(totalHoras > 0 || horaNegativa > 0 || diaNegativo || pagada) && !vacaciones && !bajamedica && (
                <div className="flex flex-col items-center">
                  {totalHoras > 0 && (
                    <span className="text-base font-bold">
                      {formatHoursToHM(totalHoras)}
                    </span>
                  )}
                  {(horaNegativa > 0 || diaNegativo) && (
                    <span className="text-base font-bold text-red-700 mt-1">
                      {horaNegativa > 0 ? `-${formatHoursToHM(horaNegativa)}` : 'Día negativo'}
                    </span>
                  )}
                  {pagada && (
                    <span className="text-xs font-semibold text-emerald-600 mt-1">
                      {paidDisplay}
                    </span>
                  )}
                  {eventos[0]?.proyecto_nombre && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Folder className="w-4 h-4" />
                      <span className="truncate max-w-[6rem]">{eventos[0].proyecto_nombre}</span>
                    </div>
                  )}
                </div>
              )}

              {totalHoras === 0 && horaNegativa <= 0 && !diaNegativo && !festivo && !bajamedica && eventos[0]?.proyecto_nombre && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Folder className="w-4 h-4" />
                  <span className="truncate max-w-[6rem]">{eventos[0].proyecto_nombre}</span>
                </div>
              )}

              {totalHoras === 0 && !festivo && !bajamedica && weekend && !eventos[0]?.proyecto_nombre && horaNegativa <= 0 && !diaNegativo && (
                <span className="text-xs italic absolute bottom-1 right-1 text-gray-400">Libre</span>
              )}
            </div>
          );
        }
      }
    }

    return elements;
  };

  const selectedTrabajador = trabajadores.find(t => t.id === Number(selectedTrabajadorId));

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto mb-4 sm:mb-6 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Gestor Avanzado de Horarios
          </h1>
          <p className="text-gray-600 mt-2">
            Planifica y controla las horas de tus trabajadores de forma eficiente.
          </p>
        </div>

        <div className="w-full bg-white rounded-xl shadow-xl max-w-7xl mx-auto p-4 sm:p-6 mb-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-3 lg:justify-start">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                className="p-2 bg-white border rounded shadow hover:bg-gray-50 transition"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div 
                onClick={handleMonthLabelClick}
                className="relative flex items-center justify-center min-w-40 lg:min-w-48 group cursor-pointer"
              >
                <strong className="text-center text-xl text-gray-700 capitalize group-hover:text-purple-600 transition flex items-center gap-1.5 select-none">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </strong>
                <input
                  ref={monthInputRef}
                  type="month"
                  value={format(currentDate, 'yyyy-MM')}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month] = e.target.value.split('-').map(Number);
                      setCurrentDate(new Date(year, month - 1, 1));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-none"
                  title="Seleccionar mes y año"
                />
              </div>

              <button
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                className="p-2 bg-white border rounded shadow hover:bg-gray-50 transition"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {copiedWeek && (
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm animate-fade-in">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Semana copiada
                </div>
              )}
              {copiedDay && (
                <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm animate-fade-in">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                  </span>
                  Día copiado
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={handleDescargarTodasPlantillas}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Download className="w-4 h-4" />
                {`Descargar Todas (${format(currentDate, 'MMMM', { locale: es })})`}
              </button>
              <button
                onClick={() => setIsFestivosModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100"
              >
                <Settings className="w-4 h-4" />
                Festivos Globales
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Contenedor del Horario (Izquierda) */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-2 text-center text-sm font-medium text-gray-500 mb-2">
                <div title="Semana" className="flex items-center justify-center font-bold text-gray-400">Sem.</div>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                  <div key={dia} className="font-semibold text-slate-600">{dia}</div>
                ))}
              </div>

              <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-2">
                {renderCalendar()}
              </div>
            </div>

            {/* Contenedor de Información del Trabajador Activo (Derecha) */}
            <div className="w-full lg:w-80 shrink-0 bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Seleccionar Trabajador
                </p>
                <WorkerAutocomplete
                  workers={trabajadores}
                  selectedId={selectedTrabajadorId}
                  onChange={setSelectedTrabajadorId}
                />
              </div>

              {selectedTrabajador && (
                <>
                  <hr className="border-slate-200" />

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Información del Trabajador
                    </h3>
                    <p className="text-lg font-bold text-slate-800 mt-1">
                      {selectedTrabajador.nombre}
                    </p>
                    {selectedTrabajador.dni && (
                      <p className="text-xs font-semibold text-slate-500 bg-slate-200/60 inline-block px-2 py-0.5 rounded mt-1">
                        DNI: {selectedTrabajador.dni}
                      </p>
                    )}
                  </div>

                  <hr className="border-slate-200" />

                  <div className="flex flex-col gap-3 text-sm">
                    {selectedTrabajador.tipo_trabajador && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Contrato</span>
                        <span className="font-semibold text-slate-700">{selectedTrabajador.tipo_trabajador}</span>
                      </div>
                    )}
                    {selectedTrabajador.horas_contratadas && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Jornada contratada</span>
                        <span className="font-semibold text-slate-700">{selectedTrabajador.horas_contratadas} hs/semana</span>
                      </div>
                    )}
                    {selectedTrabajador.correo_electronico && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Correo</span>
                        <span className="font-semibold text-slate-700 break-all">{selectedTrabajador.correo_electronico}</span>
                      </div>
                    )}
                    {selectedTrabajador.telefono && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Teléfono</span>
                        <span className="font-semibold text-slate-700">{selectedTrabajador.telefono}</span>
                      </div>
                    )}
                    {selectedTrabajador.empresa && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Empresa</span>
                        <span className="font-semibold text-slate-700">{selectedTrabajador.empresa}</span>
                      </div>
                    )}
                    {selectedTrabajador.cliente && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                        <span className="font-semibold text-slate-700">{selectedTrabajador.cliente}</span>
                      </div>
                    )}
                    {selectedTrabajador.fecha_alta && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Fecha de Alta</span>
                        <span className="font-semibold text-slate-700">
                          {format(new Date(selectedTrabajador.fecha_alta), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                    {selectedTrabajador.condiciones && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Condiciones / Obs.</span>
                        <span className="text-xs text-slate-600 block bg-white p-2 rounded border border-slate-200/60 mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {selectedTrabajador.condiciones}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4">
          <HoursSummary
            currentDate={currentDate}
            scheduleData={agruparHorarios(scheduleData)}
            onDownload={handleDescargarPlantilla}
          />
          <YearHoursSummary
            currentDate={currentDate}
            scheduleData={agruparHorarios(scheduleData)}
            onDownload={handleDescargarPlantillaAnual}
          />
        </div>
      </div>
      <HorarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleGuardarHorarios}
        fecha={selectedDay?.fecha}
        initialData={selectedDay?.eventos || []}
        initialFestivo={selectedDay?.isHoliday || false}
        initialVacaciones={selectedDay?.isVacation || false}
        initialBaja={selectedDay?.isBaja || false}
        initialHoraNegativa={selectedDay?.horaNegativa || 0}
        initialDiaNegativo={selectedDay?.diaNegativo || false}
        initialPagada={selectedDay?.pagada || false}
        initialPaidType={selectedDay?.tipoPagadas || null}
        workers={trabajadores}
      />
      <FestivosGlobalModal
        isOpen={isFestivosModalOpen}
        onClose={() => setIsFestivosModalOpen(false)}
        currentDate={currentDate}
        workerCount={trabajadores.length}
        onSave={handleGuardarFestivosGlobales}
        initialDates={globalHolidays}
      />
    </>
  );
}
