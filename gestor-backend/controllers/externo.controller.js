const db = require('../models');
const Externo = db.Externo;
const { Op } = db.Sequelize;

exports.createOrUpdate = async (req, res) => {
  const { fecha, cantidad, nombre_empresa_externo } = req.body;
  try {
    await Externo.upsert({ fecha, cantidad, nombre_empresa_externo });
    res.json({ fecha, cantidad, nombre_empresa_externo });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando externo' });
  }
};

exports.getExternos = async (req, res) => {
  const { start, end, nombre_empresa_externo } = req.query;
  const where = {};
  if (start && end) {
    where.fecha = { [Op.between]: [start, end] };
  }
  if (nombre_empresa_externo) {
    where.nombre_empresa_externo = nombre_empresa_externo;
  }
  try {
    const items = await Externo.findAll({ where });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo externos' });
  }
};
