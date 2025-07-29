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

    const totalSalarioNeto = await Trabajador.sum('salario_neto') || 0;
    const totalSalarioBruto = await Trabajador.sum('salario_bruto') || 0;

    const salarioNetoPromedio = await Trabajador.findOne({
      attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('salario_neto')), 'promedio']]
    });
    const salarioBrutoPromedio = await Trabajador.findOne({
      attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('salario_bruto')), 'promedio']]
    });

    const promedioNeto = parseFloat(salarioNetoPromedio.get('promedio')) || 0;
    const promedioBruto = parseFloat(salarioBrutoPromedio.get('promedio')) || 0;

    res.json({
      totalTrabajadores,
      trabajadoresActivos,
      trabajadoresInactivos,
      costeMensualNeto: totalSalarioNeto,
      costeMensualBruto: totalSalarioBruto,
      costeAnualNeto: totalSalarioNeto * 12,
      costeAnualBruto: totalSalarioBruto * 12,
      salarioNetoPromedio: promedioNeto,
      salarioBrutoPromedio: promedioBruto
    });
  } catch (err) {
    console.error('Error en getStats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Información de organización: trabajadores por empresa y país,
// junto con los empleados con mayor antigüedad y varias estadísticas
// adicionales como nuevas incorporaciones, tipo de contrato, rol y
// resúmenes de horas trabajadas.
exports.getOrganizationInfo = async (req, res) => {
  try {
    const today = new Date();
    const { Op } = db.Sequelize;

    // Nuevas incorporaciones
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastQuarter = new Date();
    lastQuarter.setMonth(lastQuarter.getMonth() - 3);

    const incorporacionesMes = await Trabajador.count({
      where: {
        fecha_alta: { [Op.gte]: lastMonth }
      }
    });

    const incorporacionesTrimestre = await Trabajador.count({
      where: {
        fecha_alta: { [Op.gte]: lastQuarter }
      }
    });

    const porEmpresa = await Trabajador.findAll({
      attributes: [
        'empresa',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('empresa')), 'count']
      ],
      group: ['empresa'],
      raw: true,
      order: [[db.Sequelize.literal('count'), 'DESC']]
    });

    const porPais = await Trabajador.findAll({
      attributes: [
        'pais',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('pais')), 'count']
      ],
      group: ['pais'],
      raw: true,
      order: [[db.Sequelize.literal('count'), 'DESC']]
    });

    const porContrato = await Trabajador.findAll({
      attributes: [
        'tipo_trabajador',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('tipo_trabajador')), 'count']
      ],
      group: ['tipo_trabajador'],
      raw: true,
      order: [[db.Sequelize.literal('count'), 'DESC']]
    });

    const porRol = await Trabajador.findAll({
      attributes: [
        'categoria',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('categoria')), 'count']
      ],
      group: ['categoria'],
      raw: true,
      order: [[db.Sequelize.literal('count'), 'DESC']]
    });

    const veteranos = await Trabajador.findAll({
      attributes: ['id', 'nombre', 'fecha_alta'],
      order: [['fecha_alta', 'ASC']],
      limit: 5,
      raw: true
    });

    const veteranosConAntiguedad = veteranos.map(v => {
      const years = Math.floor((today - new Date(v.fecha_alta)) / (365.25 * 24 * 60 * 60 * 1000));
      return { ...v, antiguedad: years };
    });

    // Promedios de horas y extras usando la tabla Horario
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const horasSemana = await db.Horario.findAll({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.literal('TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio))/3600')), 'horas']],
      where: { fecha: { [Op.gte]: fourWeeksAgo } },
      raw: true
    });

    const horasMes = await db.Horario.findAll({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.literal('TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio))/3600')), 'horas']],
      where: { fecha: { [Op.gte]: monthAgo } },
      raw: true
    });

    const horasExtras = await db.Horario.findAll({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.literal('GREATEST(TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio))/3600 - 8,0)')), 'extras']],
      raw: true
    });

    const promedioHorasSemana = parseFloat(horasSemana[0].horas || 0) / 4;
    const promedioHorasMes = parseFloat(horasMes[0].horas || 0);
    const horasExtrasAcumuladas = parseFloat(horasExtras[0].extras || 0);

    // Promedio de antigüedad como proxy de edad
    const edadPromedioRow = await Trabajador.findOne({
      attributes: [[db.Sequelize.fn('AVG', db.Sequelize.literal('TIMESTAMPDIFF(YEAR, fecha_alta, CURDATE())')), 'promedio']],
      raw: true
    });
    const edadPromedio = parseFloat(edadPromedioRow.promedio || 0);

    res.json({
      porEmpresa,
      porPais,
      veteranos: veteranosConAntiguedad,
      incorporacionesMes,
      incorporacionesTrimestre,
      porContrato,
      porRol,
      promedioHorasSemana,
      promedioHorasMes,
      horasExtrasAcumuladas,
      edadPromedio
    });
  } catch (err) {
    console.error('Error en getOrganizationInfo:', err);
    res.status(500).json({ error: err.message });
  }
};
