// src/components/HorasResumenAnual.jsx
import React from 'react';
import { Clock, Download } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { getYear, getDay, parseISO, format } from 'date-fns';
import { formatHoursToHM } from '../utils/utils';

function calcularTipoHoras(intervals, dateKey, isFestivo, isVacaciones, isBaja) {
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
    if (start === end) return;
    if (end <= start) {
      end += 24 * 60;
    }
    let total = (end - start) / 60;

    const dia = getDay(parseISO(dateKey));

    if (isVacaciones) {
      extras += total;
      return;
    }

    if (dia === 0 || dia === 6 || isFestivo || isBaja) {
      festivas += total;
      return;
    }

    if (start < 360) {
      const nocturnaFin = Math.min(end, 360);
      nocturnas += (nocturnaFin - start) / 60;
      total -= (nocturnaFin - start) / 60;
    }

    if (end > 1320) {
      const nocturnaInicio = Math.max(start, 1320);
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

export function YearHoursSummary({ currentDate, scheduleData, onDownload }) {
  const year = getYear(currentDate);
  const yearLabel = format(currentDate, 'yyyy');
  let resumen = { normales: 0, extras: 0, nocturnas: 0, festivas: 0, adeber: 0, pagadas: 0 };

  Object.entries(scheduleData).forEach(([dateKey, entry]) => {
    const d = parseISO(dateKey);
    if (getYear(d) === year) {
      const tipo = calcularTipoHoras(
        entry.intervals || [],
        dateKey,
        entry.isHoliday,
        entry.isVacation,
        entry.isBaja
      );
      let normalesDia = tipo.normales;
      let extrasDia = tipo.extras;
      const neg = entry.horaNegativa || 0;
      let adeberDia = 0;
      if (neg > 0) {
        if (extrasDia >= neg) {
          extrasDia -= neg;
        } else {
          adeberDia = neg - extrasDia;
          extrasDia = 0;
        }
      }
      const pagadasDia = entry.pagada ? parseFloat(entry.horasPagadas || entry.horas_pagadas || 0) : 0;
      let pagadasAplicadas = 0;
      if (pagadasDia > 0) {
        let restante = pagadasDia;

        const pagadasNormales = Math.min(normalesDia, restante);
        normalesDia -= pagadasNormales;
        pagadasAplicadas += pagadasNormales;
        restante -= pagadasNormales;

        if (restante > 0) {
          const pagadasExtras = Math.min(extrasDia, restante);
          extrasDia -= pagadasExtras;
          pagadasAplicadas += pagadasExtras;
          restante -= pagadasExtras;
        }
      }

      resumen.normales += normalesDia;
      resumen.extras += extrasDia;
      resumen.nocturnas += tipo.nocturnas;
      resumen.festivas += tipo.festivas;
      resumen.adeber += adeberDia;
      resumen.pagadas += pagadasAplicadas;
    }
  });

  const total =
    resumen.normales + resumen.extras + resumen.nocturnas + resumen.festivas;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center text-gray-800 dark:text-gray-200">
          <Clock className="mr-2 h-6 w-6 text-blue-500" />
          Resumen de Horas del Año
        </h3>
        {onDownload && (
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-700 bg-white border rounded shadow hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {`Descargar Plantilla Anual (${yearLabel})`}
          </button>
        )}
      </div>

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
            <span className="text-emerald-600 font-medium">Horas pagadas</span>
            <span className="text-md font-semibold text-emerald-500">
              {formatHoursToHM(resumen.pagadas)}
            </span>
          </div>

          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-rose-600 font-medium">Horas a deber</span>
            <span className="text-md font-semibold text-rose-500">
              {resumen.adeber > 0
                ? `-${formatHoursToHM(resumen.adeber)}`
                : formatHoursToHM(resumen.adeber)}
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
    </Motion.div>
  );
}
