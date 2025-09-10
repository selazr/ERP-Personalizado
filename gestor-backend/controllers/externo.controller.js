const db = require('../models');
const Externo = db.Externo;
const { Op } = db.Sequelize;

exports.createOrUpdate = async (req, res) => {
  const { fecha, cantidad, nombre_empresa_externo } = req.body;
  try {
    const existing = await Externo.findOne({
      where: { fecha, nombre_empresa_externo }
    });
    if (existing) {
      existing.cantidad = cantidad;
      await existing.save();
    } else {
      await Externo.create({ fecha, cantidad, nombre_empresa_externo });
    }
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

exports.getEmpresas = async (req, res) => {
  try {
    const items = await Externo.findAll({
      attributes: [
        [db.Sequelize.fn('DISTINCT', db.Sequelize.col('nombre_empresa_externo')), 'nombre_empresa_externo'],
      ],
      order: [['nombre_empresa_externo', 'ASC']],
    });
    const empresas = items.map((i) => i.get('nombre_empresa_externo'));
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo empresas' });
  }
};

exports.deleteExterno = async (req, res) => {
  const { fecha, nombre_empresa_externo } = req.body;
  try {
    await Externo.destroy({ where: { fecha, nombre_empresa_externo } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando externo' });
  }
};
