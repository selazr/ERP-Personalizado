const db = require('../models');
const Horario = db.Horario;
const Trabajador = db.Trabajador;

const durationBetween = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if ([h1, m1, h2, m2].some(Number.isNaN)) {
    return 0;
  }

  let startMinutes = h1 * 60 + m1;
  let endMinutes = h2 * 60 + m2;

  if (startMinutes === endMinutes) {
    return 0;
  }

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
};

const getWeekDay = (fecha) => {
  if (!fecha) return null;
  const parsed = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.getUTCDay();
};

const calculateHourBreakdown = (entries = [], fecha, { festivo = false, vacaciones = false, bajamedica = false } = {}) => {
  const intervals = (entries || [])
    .map(({ hora_inicio, hora_fin }) => ({ start: hora_inicio, end: hora_fin }))
    .filter(({ start, end }) => start && end);

  if (intervals.length === 0) {
    return { normales: 0, extras: 0, nocturnas: 0, festivas: 0 };
  }

  const dayOfWeek = getWeekDay(fecha);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (vacaciones) {
    const extras = intervals.reduce((acc, { start, end }) => acc + durationBetween(start, end), 0);
    return { normales: 0, extras, nocturnas: 0, festivas: 0 };
  }

  if (isWeekend || festivo || bajamedica) {
    const festivas = intervals.reduce((acc, { start, end }) => acc + durationBetween(start, end), 0);
    return { normales: 0, extras: 0, nocturnas: 0, festivas };
  }

  let nocturnas = 0;
  let diurnas = 0;

  intervals.forEach(({ start, end }) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    if ([h1, m1, h2, m2].some(Number.isNaN)) {
      return;
    }

    let startMinutes = h1 * 60 + m1;
    let endMinutes = h2 * 60 + m2;

    if (startMinutes === endMinutes) {
      return;
    }

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    let total = (endMinutes - startMinutes) / 60;

    if (startMinutes < 360) {
      const nocturnaFin = Math.min(endMinutes, 360);
      nocturnas += (nocturnaFin - startMinutes) / 60;
      total -= (nocturnaFin - startMinutes) / 60;
    }

    if (endMinutes > 1320) {
      const nocturnaInicio = Math.max(startMinutes, 1320);
      nocturnas += (endMinutes - nocturnaInicio) / 60;
      total -= (endMinutes - nocturnaInicio) / 60;
    }

    if (total > 0) {
      diurnas += total;
    }
  });

  let normales = 0;
  let extras = 0;
  if (diurnas > 8) {
    normales = 8;
    extras = diurnas - 8;
  } else {
    normales = diurnas;
  }

  return {
    normales,
    extras,
    nocturnas,
    festivas: 0,
  };
};

const roundHours = (value) => Math.round(value * 100) / 100;


exports.getHorariosByTrabajador = async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    if (trabajador.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const where = { trabajador_id: req.params.id, empresa_id: req.empresaId };

    const horarios = await Horario.findAll({ where });
    res.json(horarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
};
exports.createOrUpdateHorarios = async (req, res) => {
  try {
    const {
      trabajador_id,
      fecha,
      horarios,
      festivo,
      vacaciones,
      bajamedica,
      proyecto_nombre,
      horanegativa = 0,
      dianegativo = false,
      pagada = false,
      tipo_horas_pagadas = null
    } = req.body;

    const trabajador = await Trabajador.findByPk(trabajador_id);
    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    if (trabajador.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const empresa = trabajador.empresa ?? null;
    const empresaId = req.empresaId ?? trabajador.empresa_id;

    const breakdown = calculateHourBreakdown(horarios, fecha, {
      festivo,
      vacaciones,
      bajamedica,
    });
    const negativeValue = Math.max(parseFloat(horanegativa) || 0, 0);
    const availableByType = {
      normales: breakdown.normales,
      extras: Math.max(breakdown.extras - negativeValue, 0),
      nocturnas: breakdown.nocturnas,
      festivas: breakdown.festivas,
    };

    const requestedType = pagada ? (tipo_horas_pagadas ? String(tipo_horas_pagadas).toLowerCase() : null) : null;
    const availableForType = requestedType ? availableByType[requestedType] || 0 : 0;
    const horasPagadasCalculadas = pagada && availableForType > 0 ? roundHours(availableForType) : 0;
    const pagadaFinal = pagada && horasPagadasCalculadas > 0;
    const tipoHorasPagadasFinal = pagadaFinal ? requestedType : null;

    // Borrar los horarios anteriores del mismo día
    await Horario.destroy({
      where: { trabajador_id, fecha, empresa_id: empresaId }
    });

    const nuevos = [];

    if (horarios.length > 0) {
      horarios.forEach(h => {
        nuevos.push({
          trabajador_id,
          fecha,
          empresa_id: empresaId,
          empresa,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          festivo: festivo || false,
          vacaciones: vacaciones || false,
          bajamedica: bajamedica || false,
          proyecto_nombre: proyecto_nombre || null,
          horanegativa,
          dianegativo,
          pagada: pagadaFinal,
          horas_pagadas: pagadaFinal ? horasPagadasCalculadas : 0,
          tipo_horas_pagadas: pagadaFinal ? tipoHorasPagadasFinal : null
        });
      });
    } else if (festivo) {
      // Registrar el día como festivo aunque no tenga horas
      nuevos.push({
        trabajador_id,
        fecha,
        empresa_id: empresaId,
        empresa,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: true,
        vacaciones: vacaciones || false,
        bajamedica: false,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagadaFinal,
        horas_pagadas: pagadaFinal ? horasPagadasCalculadas : 0,
        tipo_horas_pagadas: pagadaFinal ? tipoHorasPagadasFinal : null
      });
    } else if (vacaciones) {
      // Registrar el día como vacaciones sin horas
      nuevos.push({
        trabajador_id,
        fecha,
        empresa_id: empresaId,
        empresa,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: true,
        bajamedica: false,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagadaFinal,
        horas_pagadas: pagadaFinal ? horasPagadasCalculadas : 0,
        tipo_horas_pagadas: pagadaFinal ? tipoHorasPagadasFinal : null
      });
    } else if (bajamedica) {
      nuevos.push({
        trabajador_id,
        fecha,
        empresa_id: empresaId,
        empresa,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: false,
        bajamedica: true,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagadaFinal,
        horas_pagadas: pagadaFinal ? horasPagadasCalculadas : 0,
        tipo_horas_pagadas: pagadaFinal ? tipoHorasPagadasFinal : null
      });
    }
    // Permitir asignar un proyecto sin intervalos
    else if (proyecto_nombre) {
      nuevos.push({
        trabajador_id,
        fecha,
        empresa_id: empresaId,
        empresa,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: false,
        bajamedica: false,
        proyecto_nombre,
        horanegativa,
        dianegativo,
        pagada: pagadaFinal,
        horas_pagadas: pagadaFinal ? horasPagadasCalculadas : 0,
        tipo_horas_pagadas: pagadaFinal ? tipoHorasPagadasFinal : null
      });
    } else if (horanegativa > 0 || dianegativo) {
      // Registrar horas o día negativo sin intervalos
      nuevos.push({
        trabajador_id,
        fecha,
        empresa_id: empresaId,
        empresa,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: false,
        bajamedica: false,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagadaFinal,
        horas_pagadas: pagadaFinal ? horasPagadasCalculadas : 0,
        tipo_horas_pagadas: pagadaFinal ? tipoHorasPagadasFinal : null
      });
    }

    if (nuevos.length > 0) {
      await Horario.bulkCreate(nuevos);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar horarios' });
  }
};
