const db = require('../models');
const Externo = db.Externo;
const { Op } = db.Sequelize;

exports.createOrUpdate = async (req, res) => {
  const { fecha, cantidad } = req.body;
  try {
    await Externo.upsert({ fecha, cantidad });
    res.json({ fecha, cantidad });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando externo' });
  }
};

exports.getExternos = async (req, res) => {
  const { start, end } = req.query;
  const where = {};
  if (start && end) {
    where.fecha = { [Op.between]: [start, end] };
  }
  try {
    const items = await Externo.findAll({ where });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo externos' });
  }
};
