import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import HorarioModal from '@/components/HorarioModal';
import WorkerAutocomplete from '@/components/WorkerAutocomplete';
import { HoursSummary } from '@/components/HorasResumen';
import { YearHoursSummary } from '@/components/HorasResumenAnual';
import { ChevronLeft, ChevronRight, Settings, Folder, Download } from 'lucide-react';
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

export default function ScheduleManager() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = startOfMonth(currentDate);
  const firstDayIndex = (getDay(firstDay) + 6) % 7; // Ajuste para comenzar en lunes

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
    const token = localStorage.getItem('token');
    const workerIds = [selectedTrabajadorId, ...trabajadoresExtra];
    const fechas = [fecha, ...fechasExtra];

    const requests = [];
    workerIds.forEach(wid => {
      fechas.forEach(f => {
        requests.push(
          axios.post(
            `${import.meta.env.VITE_API_URL}/horarios`,
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
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      });
    });

    Promise.all(requests).then(() => {
      axios
        .get(`${import.meta.env.VITE_API_URL}/horarios/${selectedTrabajadorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          setScheduleData(res.data);
        });
    });
  };

  const handleDescargarPlantilla = async () => {
    // Descarga el horario completo del trabajador seleccionado en formato Excel
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/horarios/${selectedTrabajadorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/horarios/${selectedTrabajadorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      const token = localStorage.getItem('token');
      const requests = trabajadores.map(t =>
        axios.get(`${import.meta.env.VITE_API_URL}/horarios/${t.id}`,
          { headers: { Authorization: `Bearer ${token}` } })
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
    const token = localStorage.getItem('token');
    axios.get(`${import.meta.env.VITE_API_URL}/trabajadores`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setTrabajadores(res.data);
      if (res.data.length > 0) setSelectedTrabajadorId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTrabajadorId) return;
    const token = localStorage.getItem('token');
    axios.get(`${import.meta.env.VITE_API_URL}/horarios/${selectedTrabajadorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setScheduleData(res.data);
    });
  }, [selectedTrabajadorId, currentDate]);

  const groupedData = agruparHorarios(scheduleData);

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="border p-4 bg-transparent" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getFechaKey(day);
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

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`
            cursor-pointer border rounded-lg h-24 w-full p-2 text-sm font-medium flex flex-col items-center justify-center relative transition-all duration-200
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

          {bajamedica && (
            <span className="text-xs font-semibold mt-2">Baja</span>
          )}
          {festivo && !bajamedica && (
            <span className="text-xs font-semibold mt-2">Festivo</span>
          )}
          {vacaciones && !festivo && !bajamedica && (
            <span className="text-xs font-semibold mt-2">Vacaciones</span>
          )}

          {(totalHoras > 0 || horaNegativa > 0 || diaNegativo || pagada) && !festivo && !vacaciones && !bajamedica && (
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

    return days;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Gestor Avanzado de Horarios
          </h1>
          <p className="text-gray-600 mt-2">
            Planifica y controla las horas de tus trabajadores de forma eficiente.
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Trabajador:</label>
            <WorkerAutocomplete
              workers={trabajadores}
              selectedId={selectedTrabajadorId}
              onChange={setSelectedTrabajadorId}
            />
          </div>
          <button
            onClick={() => alert('Aquí iría el modal de festivos')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded shadow hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            Festivos Globales
          </button>
          <button
            onClick={handleDescargarTodasPlantillas}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded shadow hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {`Descargar Todas (${format(currentDate, 'MMMM', { locale: es })})`}
          </button>
        </div>

        <div className="w-full bg-white rounded-xl shadow-xl max-w-5xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 bg-white border rounded shadow hover:bg-gray-50"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <strong className="text-xl text-gray-700">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </strong>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 bg-white border rounded shadow hover:bg-gray-50"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
              <div key={dia}>{dia}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto px-4">
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
    </>
  );
}
