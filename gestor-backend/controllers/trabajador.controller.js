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

// Estadísticas y proyecciones de salarios
exports.getStats = async (req, res) => {
  try {
    const { Op } = db.Sequelize;
    const today = new Date();

    const totalTrabajadores = await Trabajador.count();

    const trabajadoresActivos = await Trabajador.count({
      where: {
        fecha_alta: { [Op.lte]: today },
        [Op.or]: [
          { fecha_baja: null },
          { fecha_baja: { [Op.gte]: today } }
        ]
      }
    });

    const trabajadoresInactivos = totalTrabajadores - trabajadoresActivos;

    const totalSalarioNeto = await Trabajador.sum('salario_neto');
    const totalSalarioBruto = await Trabajador.sum('salario_bruto');

    const salarioNetoPromedio = await Trabajador.average('salario_neto');
    const salarioBrutoPromedio = await Trabajador.average('salario_bruto');

    res.json({
      totalTrabajadores,
      trabajadoresActivos,
      trabajadoresInactivos,
      costeMensualNeto: Number(totalSalarioNeto) || 0,
      costeMensualBruto: Number(totalSalarioBruto) || 0,
      costeAnualNeto: Number(totalSalarioNeto) * 12 || 0,
      costeAnualBruto: Number(totalSalarioBruto) * 12 || 0,
      salarioNetoPromedio: Number(salarioNetoPromedio) || 0,
      salarioBrutoPromedio: Number(salarioBrutoPromedio) || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

