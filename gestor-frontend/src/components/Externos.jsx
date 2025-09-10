import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const firstDayIndex = (getDay(firstDay) + 6) % 7;

  const getFechaKey = (day) => format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const start = format(firstDay, 'yyyy-MM-dd');
    const end = format(lastDay, 'yyyy-MM-dd');
    axios
      .get(`${import.meta.env.VITE_API_URL}/externos?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setExternos(res.data));
  }, [currentDate, firstDay, lastDay]);

  const groupedExternos = externos.reduce((acc, item) => {
    acc[item.fecha] = {
      cantidad: item.cantidad,
      nombre_empresa_externo: item.nombre_empresa_externo,
    };
    return acc;
  }, {});

  const handleDayClick = (day) => {
    const fecha = getFechaKey(day);
    const data = groupedExternos[fecha] || { cantidad: 0, nombre_empresa_externo: '' };
    setSelectedDay({ fecha, ...data });
    setIsModalOpen(true);
  };

  const handleGuardar = ({ fecha, cantidad, nombre_empresa_externo }) => {
    const token = localStorage.getItem('token');
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/externos`,
        { fecha, cantidad, nombre_empresa_externo },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setExternos((prev) => {
          const otros = prev.filter((e) => e.fecha !== fecha);
          return [...otros, { fecha, cantidad, nombre_empresa_externo }];
        });
      });
  };

  const handleCalcularMedia = async () => {
    if (!startRange || !endRange) return;
    const token = localStorage.getItem('token');
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/externos`, {
      headers: { Authorization: `Bearer ${token}` },
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
      const cantidad = data?.cantidad;
      const isMarked = cantidad !== undefined;
      days.push(
        <div
          key={day}
          className={`cursor-pointer border rounded-lg h-24 w-full p-2 text-sm font-medium flex flex-col items-center justify-center relative hover:shadow-md transition-all duration-200 ${isMarked ? 'bg-teal-100 border-teal-400' : 'bg-white'}`}
          onClick={() => handleDayClick(day)}
        >
          <span className="absolute top-1 left-1 text-xs font-semibold text-gray-500">
            {day}
          </span>
          {isMarked && (
            <span className="text-xl font-bold text-teal-600 mt-auto">{cantidad}</span>
          )}
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
            <input
              type="text"
              placeholder="Empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="border p-2 rounded text-black"
            />
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
          initialCantidad={selectedDay.cantidad}
          initialNombre={selectedDay.nombre_empresa_externo}
          onSave={handleGuardar}
        />
      )}
    </>
  );
}
