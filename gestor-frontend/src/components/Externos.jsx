import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay, differenceInCalendarDays } from 'date-fns';
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
    acc[item.fecha] = item.cantidad;
    return acc;
  }, {});

  const handleDayClick = (day) => {
    const fecha = getFechaKey(day);
    const cantidad = groupedExternos[fecha] || 0;
    setSelectedDay({ fecha, cantidad });
    setIsModalOpen(true);
  };

  const handleGuardar = ({ fecha, cantidad }) => {
    const token = localStorage.getItem('token');
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/externos`,
        { fecha, cantidad },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setExternos((prev) => {
          const otros = prev.filter((e) => e.fecha !== fecha);
          return [...otros, { fecha, cantidad }];
        });
      });
  };

  const handleCalcularMedia = async () => {
    if (!startRange || !endRange) return;
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/externos?start=${startRange}&end=${endRange}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
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
      days.push(<div key={`empty-${i}`} className="border p-4 bg-transparent" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getFechaKey(day);
      const cantidad = groupedExternos[dateKey];
      days.push(
        <div
          key={day}
          className="border p-4 cursor-pointer hover:bg-gray-100 min-h-[80px] flex flex-col"
          onClick={() => handleDayClick(day)}
        >
          <span>{day}</span>
          {cantidad !== undefined && <span className="text-sm mt-auto">{cantidad} ext</span>}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            <ChevronLeft />
          </button>
          <h2 className="text-xl font-bold">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            <ChevronRight />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="font-semibold">
              {d}
            </div>
          ))}
          {renderCalendar()}
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Media de Externos</h3>
          <div className="flex gap-2 items-center">
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
          onSave={handleGuardar}
        />
      )}
    </div>
  );
}
