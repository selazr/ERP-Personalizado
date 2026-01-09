const db = require('../models');
const Trabajador = db.Trabajador;

exports.getAll = async (req, res) => {
  const trabajadores = await Trabajador.findAll({
    where: { empresa_id: req.empresaId }
  });
  res.json(trabajadores);
};

exports.getById = async (req, res) => {
  const trabajador = await Trabajador.findByPk(req.params.id);
  if (!trabajador) {
    return res.status(404).json({ error: 'No encontrado' });
  }

  if (trabajador.empresa_id !== req.empresaId) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  res.json(trabajador);
};

exports.create = async (req, res) => {
  try {
    if (req.body.empresa_id && Number(req.body.empresa_id) !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const nuevo = await Trabajador.create({
      ...req.body,
      empresa_id: req.empresaId
    });
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
    if (trabajador.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
    if (req.body.empresa_id && Number(req.body.empresa_id) !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    await trabajador.update({ ...req.body, empresa_id: req.empresaId });
    res.json(trabajador);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
//DELETE
exports.remove = async (req, res) => {
  const trabajador = await Trabajador.findByPk(req.params.id);
  if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
  if (trabajador.empresa_id !== req.empresaId) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
  await trabajador.destroy();
  res.status(204).send();
};

// Estadísticas y proyecciones de salarios
exports.getStats = async (req, res) => {
  try {
    const { Op } = db.Sequelize;
    const today = new Date();

    const totalTrabajadores = await Trabajador.count({
      where: { empresa_id: req.empresaId }
    });

    const trabajadoresActivos = await Trabajador.count({
      where: {
        empresa_id: req.empresaId,
        fecha_alta: { [Op.lte]: today },
        [Op.or]: [
          { fecha_baja: null },
          { fecha_baja: { [Op.gte]: today } }
        ]
      }
    });

    const trabajadoresInactivos = totalTrabajadores - trabajadoresActivos;

    const totalSalarioNeto = await Trabajador.sum('salario_neto', {
      where: { empresa_id: req.empresaId }
    }) || 0;
    const totalSalarioBruto = await Trabajador.sum('salario_bruto', {
      where: { empresa_id: req.empresaId }
    }) || 0;

    const salarioNetoPromedio = await Trabajador.findOne({
      attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('salario_neto')), 'promedio']],
      where: { empresa_id: req.empresaId }
    });
    const salarioBrutoPromedio = await Trabajador.findOne({
      attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('salario_bruto')), 'promedio']],
      where: { empresa_id: req.empresaId }
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

    const activeCondition = {
      empresa_id: req.empresaId,
      fecha_alta: { [Op.lte]: today },
      [Op.or]: [
        { fecha_baja: null },
        { fecha_baja: { [Op.gte]: today } }
      ]
    };

    const incorporacionesMes = await Trabajador.count({
      where: {
        ...activeCondition,
        fecha_alta: { [Op.gte]: lastMonth, [Op.lte]: today }
      }
    });

    const incorporacionesTrimestre = await Trabajador.count({
      where: {
        ...activeCondition,
        fecha_alta: { [Op.gte]: lastQuarter, [Op.lte]: today }
      }
    });

    // Obtener todos los trabajadores activos para agruparlos
    const activeWorkers = await Trabajador.findAll({
      attributes: [
        'id',
        'nombre',
        'empresa',
        'pais',
        'tipo_trabajador',
        'categoria',
        'fecha_alta',
        'fecha_baja'
      ],
      where: activeCondition,
      raw: true
    });

    // Función auxiliar para agrupar trabajadores
    const groupBy = (key, label) => {
      const groups = {};
      activeWorkers.forEach(w => {
        const value = w[key] || 'Sin especificar';
        if (!groups[value]) {
          groups[value] = { [label]: w[key], count: 0, workers: [] };
        }
        groups[value].count++;
        groups[value].workers.push({
          id: w.id,
          nombre: w.nombre,
          empresa: w.empresa,
          pais: w.pais,
          categoria: w.categoria,
          tipo_trabajador: w.tipo_trabajador,
          fecha_alta: w.fecha_alta,
          fecha_baja: w.fecha_baja
        });
      });
      return Object.values(groups).sort((a, b) => b.count - a.count);
    };

    const porEmpresa = groupBy('empresa', 'empresa');
    const porPais = groupBy('pais', 'pais');
    const porContrato = groupBy('tipo_trabajador', 'tipo_trabajador');
    const porRol = groupBy('categoria', 'categoria');

    const veteranos = activeWorkers
      .map(v => ({
        id: v.id,
        nombre: v.nombre,
        empresa: v.empresa,
        tipo_trabajador: v.tipo_trabajador,
        fecha_alta: v.fecha_alta,
        fecha_baja: v.fecha_baja,
        antiguedad: Math.floor((today - new Date(v.fecha_alta)) / (365.25 * 24 * 60 * 60 * 1000))
      }))
      .sort((a, b) => new Date(a.fecha_alta) - new Date(b.fecha_alta))
      .slice(0, 5);

    // Promedios de horas y extras usando la tabla Horario
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const horasSemana = await db.Horario.findAll({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.literal('TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio))/3600')), 'horas']],
      where: { fecha: { [Op.gte]: fourWeeksAgo } },
      include: [{ model: Trabajador, attributes: [], where: activeCondition }],
      raw: true
    });

    const horasMes = await db.Horario.findAll({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.literal('TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio))/3600')), 'horas']],
      where: { fecha: { [Op.gte]: monthAgo } },
      include: [{ model: Trabajador, attributes: [], where: activeCondition }],
      raw: true
    });

    const horasExtras = await db.Horario.findAll({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.literal('GREATEST(TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio))/3600 - 8,0)')), 'extras']],
      include: [{ model: Trabajador, attributes: [], where: activeCondition }],
      raw: true
    });

    const horasExtrasPagadas = await db.Horario.findAll({
      attributes: [
        [
          db.Sequelize.fn(
            'SUM',
            db.Sequelize.literal("CASE WHEN pagada = 1 AND tipo_horas_pagadas = 'extras' THEN horas_pagadas ELSE 0 END")
          ),
          'pagadas'
        ]
      ],
      include: [{ model: Trabajador, attributes: [], where: activeCondition }],
      raw: true
    });

    const promedioHorasSemana = parseFloat(horasSemana[0].horas || 0) / 4;
    const promedioHorasMes = parseFloat(horasMes[0].horas || 0);
    const horasExtrasAcumuladasRaw = parseFloat(horasExtras[0].extras || 0);
    const horasExtrasPagadasTotal = parseFloat(horasExtrasPagadas[0].pagadas || 0);
    const horasExtrasAcumuladas = Math.max(horasExtrasAcumuladasRaw - horasExtrasPagadasTotal, 0);

    // Promedio de antigüedad como proxy de edad
    const edadPromedioRow = await Trabajador.findOne({
      attributes: [[db.Sequelize.fn('AVG', db.Sequelize.literal('TIMESTAMPDIFF(YEAR, fecha_alta, CURDATE())')), 'promedio']],
      where: activeCondition,
      raw: true
    });
    const edadPromedio = parseFloat(edadPromedioRow.promedio || 0);

    res.json({
      totalTrabajadores: activeWorkers.length,
      porEmpresa,
      porPais,
      veteranos,
      incorporacionesMes,
      incorporacionesTrimestre,
      porContrato,
      porRol,
      promedioHorasSemana,
      promedioHorasMes,
      horasExtrasAcumuladas,
      horasExtrasPagadas: horasExtrasPagadasTotal,
      edadPromedio,
      empresaSeleccionada: req.empresaId
    });
  } catch (err) {
    console.error('Error en getOrganizationInfo:', err);
    res.status(500).json({ error: err.message });
  }
};
