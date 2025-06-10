const db = require('../models');
const Trabajador = db.Trabajador;

exports.getAll = async (req, res) => {
  const trabajadores = await Trabajador.findAll();
  res.json(trabajadores);
};

exports.getById = async (req, res) => {
  const trabajador = await Trabajador.findByPk(req.params.id);
  trabajador ? res.json(trabajador) : res.status(404).json({ error: 'No encontrado' });
};

exports.create = async (req, res) => {
  try {
    const nuevo = await Trabajador.create(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
//UPDATE
exports.update = async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
    await trabajador.update(req.body);
    res.json(trabajador);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
//DELETE
exports.remove = async (req, res) => {
  const trabajador = await Trabajador.findByPk(req.params.id);
  if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
  await trabajador.destroy();
  res.status(204).send();
};
