const db = require('../models');
const Horario = db.Horario;


exports.getHorariosByTrabajador = async (req, res) => {
  try {
    const horarios = await Horario.findAll({
      where: { trabajador_id: req.params.id }
    });
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
      horas_pagadas = 0
    } = req.body;

    // Borrar los horarios anteriores del mismo día
    await Horario.destroy({
      where: { trabajador_id, fecha }
    });

    const nuevos = [];

    if (horarios.length > 0) {
      horarios.forEach(h => {
        nuevos.push({
          trabajador_id,
          fecha,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          festivo: festivo || false,
          vacaciones: vacaciones || false,
          bajamedica: bajamedica || false,
          proyecto_nombre: proyecto_nombre || null,
          horanegativa,
          dianegativo,
          pagada: pagada || false,
          horas_pagadas: pagada ? horas_pagadas || 0 : 0
        });
      });
    } else if (festivo) {
      // Registrar el día como festivo aunque no tenga horas
      nuevos.push({
        trabajador_id,
        fecha,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: true,
        vacaciones: vacaciones || false,
        bajamedica: false,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagada || false,
        horas_pagadas: pagada ? horas_pagadas || 0 : 0
      });
    } else if (vacaciones) {
      // Registrar el día como vacaciones sin horas
      nuevos.push({
        trabajador_id,
        fecha,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: true,
        bajamedica: false,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagada || false,
        horas_pagadas: pagada ? horas_pagadas || 0 : 0
      });
    } else if (bajamedica) {
      nuevos.push({
        trabajador_id,
        fecha,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: false,
        bajamedica: true,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagada || false,
        horas_pagadas: pagada ? horas_pagadas || 0 : 0
      });
    }
    // Permitir asignar un proyecto sin intervalos
    else if (proyecto_nombre) {
      nuevos.push({
        trabajador_id,
        fecha,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: false,
        bajamedica: false,
        proyecto_nombre,
        horanegativa,
        dianegativo,
        pagada: pagada || false,
        horas_pagadas: pagada ? horas_pagadas || 0 : 0
      });
    } else if (horanegativa > 0 || dianegativo) {
      // Registrar horas o día negativo sin intervalos
      nuevos.push({
        trabajador_id,
        fecha,
        hora_inicio: '00:00:00',
        hora_fin: '00:00:00',
        festivo: false,
        vacaciones: false,
        bajamedica: false,
        proyecto_nombre: proyecto_nombre || null,
        horanegativa,
        dianegativo,
        pagada: pagada || false,
        horas_pagadas: pagada ? horas_pagadas || 0 : 0
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
