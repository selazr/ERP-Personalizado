const db = require('../models');
const Empresa = db.Empresa;

exports.getAll = async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo empresas' });
  }
};
