// src/components/HorasResumen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import { getYear, getMonth, getDay, parseISO } from 'date-fns';
import { calculateTotalHoursFromIntervals, formatHoursToHM } from '../utils/utils';


function calcularTipoHoras(intervals, dateKey, isFestivo) {
  let totalDiario = 0;
  let normales = 0,
    extras = 0,
    nocturnas = 0,
    festivas = 0;

  intervals.forEach(({ hora_inicio, hora_fin }) => {
    if (!hora_inicio || !hora_fin) return;
    const [h1, m1] = hora_inicio.split(':').map(Number);
    const [h2, m2] = hora_fin.split(':').map(Number);
    let start = h1 * 60 + m1;
    let end = h2 * 60 + m2;
    if (end <= start) {
      end += 24 * 60; // Interval crosses midnight
    }
    let total = (end - start) / 60;

    const dia = getDay(parseISO(dateKey));

    if (dia === 0 || dia === 6 || isFestivo) {
      festivas += total;
      return; // Todo el intervalo es festivo
    }

    // 360 minutos = 6:00 AM
    if (start < 360) {
      const nocturnaFin = Math.min(end, 360); // límite superior hasta las 6:00
      nocturnas += (nocturnaFin - start) / 60;
      total -= (nocturnaFin - start) / 60;
    }

    // 1320 minutos = 22:00 PM
    if (end > 1320) {
      const nocturnaInicio = Math.max(start, 1320); // límite inferior desde las 22:00
      nocturnas += (end - nocturnaInicio) / 60;
      total -= (end - nocturnaInicio) / 60;
    }

    totalDiario += total;
  });

  if (totalDiario > 8) {
    normales = 8;
    extras = totalDiario - 8;
  } else {
    normales = totalDiario;
  }

  return { normales, extras, nocturnas, festivas };
}

export function HoursSummary({ currentDate, scheduleData }) {
  const year = getYear(currentDate);
  const month = getMonth(currentDate);
  let resumen = { normales: 0, extras: 0, nocturnas: 0, festivas: 0 };

  Object.entries(scheduleData).forEach(([dateKey, entry]) => {
    const d = parseISO(dateKey);
    if (getYear(d) === year && getMonth(d) === month) {
      const tipo = calcularTipoHoras(entry.intervals || [], dateKey, entry.isHoliday);
      resumen.normales += tipo.normales;
      resumen.extras += tipo.extras;
      resumen.nocturnas += tipo.nocturnas;
      resumen.festivas += tipo.festivas;
    }
  });

  const total = resumen.normales + resumen.extras + resumen.nocturnas + resumen.festivas;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-6 mt-6"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
        <Clock className="mr-2 h-6 w-6 text-blue-500" />
        Resumen de Horas del Mes
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total:</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {formatHoursToHM(total)}
          </p>
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg space-y-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Resumen de horas</h3>

        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-gray-600 dark:text-gray-200">Horas normales</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
            {formatHoursToHM(resumen.normales)}
          </span>
        </div>

        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-purple-600 font-medium">Horas Extra laborable</span>
          <span className="text-md font-semibold text-purple-500">
            {formatHoursToHM(resumen.extras)}
          </span>
        </div>

        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-yellow-600 font-medium">Horas nocturnas</span>
          <span className="text-md font-semibold text-yellow-500">
            {formatHoursToHM(resumen.nocturnas)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-red-600 font-medium">Horas festivas</span>
          <span className="text-md font-semibold text-red-500">
            {formatHoursToHM(resumen.festivas)}
          </span>
        </div>
      </div>

      </div>
    </motion.div>
  );
}
