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
    const { trabajador_id, fecha, horarios, festivo, proyecto_nombre } = req.body;

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
          proyecto_nombre: proyecto_nombre || null
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
        proyecto_nombre: proyecto_nombre || null
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
