// src/controllers/schedule.controller.js
import Schedule from '../models/schedule.model.js';

export const createSchedule = async (req, res) => {
  try {
    const nuevo = await Schedule.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

export const getScheduleByWorker = async (req, res) => {
  try {
    const { trabajador_id } = req.params;
    const data = await Schedule.findAll({ where: { trabajador_id } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
};

export const deleteScheduleByDate = async (req, res) => {
  try {
    const { trabajador_id, fecha } = req.params;
    await Schedule.destroy({ where: { trabajador_id, fecha } });
    res.json({ message: 'Horario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
