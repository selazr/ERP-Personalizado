const db = require('../models');
const Externo = db.Externo;
const { Op } = db.Sequelize;

exports.createOrUpdate = async (req, res) => {
  const { fecha, cantidad, nombre_empresa_externo } = req.body;
  const trimmedName = (nombre_empresa_externo || '').trim();
  const cantidadNumerica = Number.parseInt(cantidad, 10);

  if (!fecha || !trimmedName) {
    return res.status(400).json({ error: 'Fecha y empresa son obligatorias' });
  }

  if (Number.isNaN(cantidadNumerica) || cantidadNumerica < 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un número válido' });
  }

  try {
    await Externo.upsert({
      fecha,
      cantidad: cantidadNumerica,
      nombre_empresa_externo: trimmedName,
      empresa_id: req.empresaId
    });
    res.json({ fecha, cantidad: cantidadNumerica, nombre_empresa_externo: trimmedName });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando externo' });
  }
};

exports.getExternos = async (req, res) => {
  const { start, end, nombre_empresa_externo } = req.query;
  const where = { empresa_id: req.empresaId };
  if (start && end) {
    where.fecha = { [Op.between]: [start, end] };
  }
  if (nombre_empresa_externo) {
    where.nombre_empresa_externo = nombre_empresa_externo.trim();
  }
  try {
    const items = await Externo.findAll({ where, order: [['fecha', 'ASC'], ['nombre_empresa_externo', 'ASC']] });
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
      where: { empresa_id: req.empresaId },
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
  const trimmedName = (nombre_empresa_externo || '').trim();

  if (!fecha || !trimmedName) {
    return res.status(400).json({ error: 'Fecha y empresa son obligatorias' });
  }

  try {
    await Externo.destroy({ where: { fecha, nombre_empresa_externo: trimmedName, empresa_id: req.empresaId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando externo' });
  }
};
