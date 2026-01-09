import React, { useEffect, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  differenceInCalendarDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import ExternoModal from '@/components/ExternoModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiUrl } from '@/utils/api';
import apiClient from '@/utils/apiClient';
import { useEmpresa } from '@/context/EmpresaContext';

export default function Externos() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [externos, setExternos] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startRange, setStartRange] = useState('');
  const [endRange, setEndRange] = useState('');
  const [average, setAverage] = useState(null);
  const [amount, setAmount] = useState('');
  const [pricePerWorker, setPricePerWorker] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companies, setCompanies] = useState([]);
  const { empresaId } = useEmpresa();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = startOfMonth(currentDate);
  const firstDayIndex = (getDay(firstDay) + 6) % 7;

  const getFechaKey = (day) => format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');

  useEffect(() => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    if (!empresaId) return;

    apiClient
      .get(apiUrl('externos'), {
        params: { start, end },
      })
      .then((res) => setExternos(res.data))
      .catch((err) => {
        console.error('Error obteniendo externos:', err);
      });
  }, [currentDate, empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    apiClient
      .get(apiUrl('externos/empresas'))
      .then((res) => setCompanies(res.data));
  }, [empresaId]);

  const groupedExternos = externos.reduce((acc, item) => {
    if (!acc[item.fecha]) acc[item.fecha] = [];
    acc[item.fecha].push({
      cantidad: item.cantidad,
      nombre_empresa_externo: item.nombre_empresa_externo,
    });
    return acc;
  }, {});

  const handleDayClick = (day) => {
    const fecha = getFechaKey(day);
    const data = groupedExternos[fecha] || [];
    setSelectedDay({ fecha, items: data });
    setIsModalOpen(true);
  };

  const handleGuardar = async ({ fecha, items }) => {
    const sanitizedItems = items
      .map((item) => ({
        nombre_empresa_externo: item.nombre_empresa_externo.trim(),
        cantidad: Number(item.cantidad),
      }))
      .filter((item) => item.nombre_empresa_externo && item.cantidad > 0);

    const prevItems = externos.filter((e) => e.fecha === fecha);
    const prevNames = new Set(prevItems.map((i) => i.nombre_empresa_externo));
    const newNames = new Set(sanitizedItems.map((i) => i.nombre_empresa_externo));

    try {
      const toDelete = [...prevNames].filter((name) => !newNames.has(name));
      await Promise.all(
        toDelete.map((name) =>
          apiClient.delete(apiUrl('externos'), {
            data: { fecha, nombre_empresa_externo: name },
          })
        )
      );

      await Promise.all(
        sanitizedItems.map((item) =>
          apiClient.post(
            apiUrl('externos'),
            { fecha, cantidad: item.cantidad, nombre_empresa_externo: item.nombre_empresa_externo }
          )
        )
      );

      setExternos((prev) => {
        const otros = prev.filter((e) => e.fecha !== fecha);
        return [
          ...otros,
          ...sanitizedItems.map((item) => ({
            fecha,
            cantidad: item.cantidad,
            nombre_empresa_externo: item.nombre_empresa_externo,
          })),
        ];
      });

      setSelectedDay({ fecha, items: sanitizedItems });

      setCompanies((prev) => {
        const updated = new Set(prev);
        sanitizedItems.forEach((item) => {
          if (item.nombre_empresa_externo) {
            updated.add(item.nombre_empresa_externo);
          }
        });
        return Array.from(updated).sort((a, b) => a.localeCompare(b));
      });
    } catch (err) {
      console.error('Error guardando externos:', err);
    }
  };

  const handleCalcularMedia = async () => {
    if (!startRange || !endRange) return;
    const res = await apiClient.get(apiUrl('externos'), {
      params: {
        start: startRange,
        end: endRange,
        nombre_empresa_externo: companyName,
      },
    });
    const diff = differenceInCalendarDays(new Date(endRange), new Date(startRange)) + 1;
    const total = res.data.reduce((sum, item) => sum + item.cantidad, 0);
    const avg = total / diff;
    setAverage(avg);
    if (amount) {
      setPricePerWorker(parseFloat(amount) / avg);
    }
  };

  useEffect(() => {
    setStartRange('');
    setEndRange('');
    setAverage(null);
    setAmount('');
    setPricePerWorker(null);
    setCompanyName('');
  }, [empresaId]);

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div key={`empty-${i}`} className="border rounded-lg p-2 bg-transparent" />
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getFechaKey(day);
      const data = groupedExternos[dateKey];
      const isMarked = data && data.length > 0;
      days.push(
        <div
          key={day}
          className={`cursor-pointer border rounded-lg h-24 w-full p-2 text-sm font-medium flex flex-col items-center justify-center relative hover:shadow-md transition-all duration-200 ${isMarked ? 'bg-teal-100 border-teal-400' : 'bg-white'}`}
          onClick={() => handleDayClick(day)}
        >
          <span className="absolute top-1 left-1 text-xs font-semibold text-gray-500">
            {day}
          </span>
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 text-gray-900">
        <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Gestor de Externos
          </h1>
          <p className="text-gray-600 mt-2">Controla y planifica los externos diarios.</p>
        </div>

        <div className="w-full bg-white rounded-xl shadow-xl max-w-5xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                )
              }
              className="p-2 bg-white border rounded shadow hover:bg-gray-50"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <strong className="text-xl text-gray-700">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </strong>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                )
              }
              className="p-2 bg-white border rounded shadow hover:bg-gray-50"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
        </div>

        <div className="w-full bg-white rounded-xl shadow-xl max-w-5xl mx-auto p-4 sm:p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">Media de Externos</h3>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="date"
              value={startRange}
              onChange={(e) => setStartRange(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <input
              type="date"
              value={endRange}
              onChange={(e) => setEndRange(e.target.value)}
              className="border p-2 rounded text-black"
            />
            <select
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="border p-2 rounded text-black"
            >
              <option value="">Empresa</option>
              {companies.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="€"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 rounded text-black w-24"
            />
            <button
              onClick={handleCalcularMedia}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Calcular
            </button>
          </div>
          {average !== null && (
            <>
              <p className="mt-2">Media: {average.toFixed(2)}</p>
              {pricePerWorker !== null && (
                <p className="mt-1">Precio por trabajador: {pricePerWorker.toFixed(2)} €</p>
              )}
            </>
          )}
        </div>
      </div>
      {selectedDay && (
        <ExternoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fecha={selectedDay.fecha}
          initialItems={selectedDay.items}
          onSave={handleGuardar}
          companies={companies}
        />
      )}
    </>
  );
}
