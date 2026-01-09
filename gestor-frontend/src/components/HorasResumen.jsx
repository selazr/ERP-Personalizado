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
  let adeberBalance = 0;

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

      if (adeberDia > 0) {
        adeberBalance += adeberDia;
      }

      resumen.normales += normalesDia;
      resumen.nocturnas += nocturnasDia;
      resumen.festivas += festivasDia;
      resumen.pagadas += pagadasAplicadas;

      if (extrasDia > 0 && adeberBalance > 0) {
        const compensation = Math.min(extrasDia, adeberBalance);
        extrasDia -= compensation;
        adeberBalance -= compensation;
      }

      extraBalance += extrasDia;
      extraBalance = Math.max(extraBalance, 0);
      resumen.extras = extraBalance;
      resumen.adeber = adeberBalance;
    });

  const total = resumen.normales + resumen.extras + resumen.nocturnas + resumen.festivas;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl shadow-xl p-6 mt-6 border"
      style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', boxShadow: 'var(--theme-shadow)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center" style={{ color: 'var(--theme-text)' }}>
          <Clock className="mr-2 h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
          Resumen de Horas del Mes
        </h3>
        {onDownload && (
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium border rounded shadow"
            style={{
              color: 'var(--theme-text)',
              background: 'var(--theme-chip)',
              borderColor: 'var(--theme-card-border)'
            }}
          >
            <Download className="w-4 h-4" />
            {`Descargar Plantilla (${monthLabel})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="rounded-lg p-4 shadow-md border"
          style={{ background: 'var(--theme-chip)', borderColor: 'var(--theme-card-border)' }}
        >
          <p className="text-sm mb-1" style={{ color: 'var(--theme-text-muted)' }}>
            Total:
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
            {formatHoursToHM(total)}
          </p>
        </div>

        <div
          className="rounded-2xl p-6 shadow-lg space-y-3 border"
          style={{ background: 'var(--theme-chip)', borderColor: 'var(--theme-card-border)' }}
        >
          <h3 className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            Resumen de horas
          </h3>

          <div
            className="flex justify-between items-center border-b pb-2"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <span style={{ color: 'var(--theme-text)' }}>Horas normales</span>
            <span className="text-lg font-bold" style={{ color: 'var(--theme-accent)' }}>
              {formatHoursToHM(resumen.normales)}
            </span>
          </div>

          <div
            className="flex justify-between items-center border-b pb-2"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <span className="font-medium" style={{ color: 'var(--theme-accent-strong)' }}>
              Horas Extra laborable
            </span>
            <span className="text-md font-semibold" style={{ color: 'var(--theme-accent)' }}>
              {formatHoursToHM(resumen.extras)}
            </span>
          </div>

          <div
            className="flex justify-between items-center border-b pb-2"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <span className="font-medium" style={{ color: 'var(--theme-accent-strong)' }}>
              Horas pagadas
            </span>
            <span className="text-md font-semibold" style={{ color: 'var(--theme-accent)' }}>
              {formatHoursToHM(resumen.pagadas)}
            </span>
          </div>

          <div
            className="flex justify-between items-center border-b pb-2"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <span className="font-medium" style={{ color: 'var(--theme-accent-strong)' }}>
              Horas a deber
            </span>
            <span className="text-md font-semibold" style={{ color: 'var(--theme-accent)' }}>
              {resumen.adeber > 0
                ? `-${formatHoursToHM(resumen.adeber)}`
                : formatHoursToHM(resumen.adeber)}
            </span>
          </div>

          <div
            className="flex justify-between items-center border-b pb-2"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <span className="font-medium" style={{ color: 'var(--theme-accent-strong)' }}>
              Horas nocturnas
            </span>
            <span className="text-md font-semibold" style={{ color: 'var(--theme-accent)' }}>
              {formatHoursToHM(resumen.nocturnas)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium" style={{ color: 'var(--theme-accent-strong)' }}>
              Horas festivas
            </span>
            <span className="text-md font-semibold" style={{ color: 'var(--theme-accent)' }}>
              {formatHoursToHM(resumen.festivas)}
            </span>
          </div>
        </div>

      </div>
    </Motion.div>
  );
}
