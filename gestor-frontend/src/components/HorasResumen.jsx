// src/components/HorasResumen.jsx
import React from 'react';
import { Clock, Download } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { getYear, getMonth, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateHourBreakdown, formatHoursToHM } from '../utils/utils';

export function HoursSummary({ currentDate, scheduleData, onDownload }) {
  const year = getYear(currentDate);
  const month = getMonth(currentDate);
  const monthLabel = format(currentDate, 'MMMM', { locale: es });
  let resumen = { normales: 0, extras: 0, nocturnas: 0, festivas: 0, adeber: 0, pagadas: 0 };
  let extraBalance = 0;

  Object.entries(scheduleData)
    .filter(([dateKey]) => {
      const d = parseISO(dateKey);
      return getYear(d) === year && getMonth(d) === month;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateKey, entry]) => {
      const tipo = calculateHourBreakdown(entry.intervals || [], dateKey, {
        isHoliday: entry.isHoliday,
        isVacation: entry.isVacation,
        isBaja: entry.isBaja,
      });
      let normalesDia = tipo.normales;
      let extrasDia = tipo.extras;
      let nocturnasDia = tipo.nocturnas;
      let festivasDia = tipo.festivas;
      const neg = entry.horaNegativa || 0;
      let adeberDia = 0;
      if (neg > 0) {
        let remainingNeg = neg;
        const fromExtrasDia = Math.min(extrasDia, remainingNeg);
        extrasDia -= fromExtrasDia;
        remainingNeg -= fromExtrasDia;

        if (remainingNeg > 0 && extraBalance > 0) {
          const fromBalance = Math.min(extraBalance, remainingNeg);
          extraBalance -= fromBalance;
          remainingNeg -= fromBalance;
        }

        adeberDia = remainingNeg;
      }
      const pagadasDia = entry.pagada ? parseFloat(entry.horasPagadas || entry.horas_pagadas || 0) : 0;
      const tipoPagadas = entry.tipoPagadas || entry.tipo_horas_pagadas || null;
      let pagadasAplicadas = 0;
      const aplicarPagoPorTipo = (type, cantidad) => {
        const safeAmount = Math.max(cantidad, 0);
        if (!type || safeAmount <= 0) {
          return safeAmount === 0 && !!type;
        }
        const normalized = type.toLowerCase();
        let applied = 0;
        switch (normalized) {
          case 'normales':
            applied = Math.min(normalesDia, safeAmount);
            normalesDia -= applied;
            break;
          case 'extras':
            applied = Math.min(extrasDia, safeAmount);
            extrasDia -= applied;
            break;
          case 'nocturnas':
            applied = Math.min(nocturnasDia, safeAmount);
            nocturnasDia -= applied;
            break;
          case 'festivo':
          case 'festiva':
          case 'festivas':
            applied = Math.min(festivasDia, safeAmount);
            festivasDia -= applied;
            break;
          default:
            return false;
        }
        pagadasAplicadas += applied;
        return true;
      };

      if (pagadasDia > 0) {
        const handled = aplicarPagoPorTipo(tipoPagadas, pagadasDia);
        if (!handled) {
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

          if (restante > 0) {
            const pagadasNocturnas = Math.min(nocturnasDia, restante);
            nocturnasDia -= pagadasNocturnas;
            pagadasAplicadas += pagadasNocturnas;
            restante -= pagadasNocturnas;
          }

          if (restante > 0) {
            const pagadasFestivas = Math.min(festivasDia, restante);
            festivasDia -= pagadasFestivas;
            pagadasAplicadas += pagadasFestivas;
            restante -= pagadasFestivas;
          }
        }
      }

      resumen.normales += normalesDia;
      resumen.nocturnas += nocturnasDia;
      resumen.festivas += festivasDia;
      resumen.adeber += adeberDia;
      resumen.pagadas += pagadasAplicadas;
      extraBalance += extrasDia;
      extraBalance = Math.max(extraBalance, 0);
      resumen.extras = extraBalance;
    });

  const total = resumen.normales + resumen.extras + resumen.nocturnas + resumen.festivas;

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
          Resumen de Horas del Mes
        </h3>
        {onDownload && (
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-700 bg-white border rounded shadow hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {`Descargar Plantilla (${monthLabel})`}
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
