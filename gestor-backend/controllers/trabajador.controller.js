const path = require('path');
const fs = require('fs/promises');
const db = require('../models');
const Trabajador = db.Trabajador;
const Empresa = db.Empresa;

const INFO_DIR = path.join(__dirname, '..', 'información');
const BOOLEAN_FIELDS = [
  'desplazamiento',
  'a1',
  'permiso_b',
  'limosa',
  'epis',
  'autonomo',
  'practicas',
  'nda_firmado',
  'revision_medica'
];

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return Boolean(value);
};

const sanitizeFolderName = (value) => {
  const safeName = String(value || 'trabajador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return safeName || 'trabajador';
};

const normalizeTrabajadorPayload = (payload, { applyDefaults = false } = {}) => {
  const normalized = { ...payload };

  BOOLEAN_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(normalized, field)) {
      normalized[field] = toBoolean(normalized[field]);
    }
  });

  if (applyDefaults && !Object.prototype.hasOwnProperty.call(normalized, 'autonomo')) {
    normalized.autonomo = false;
  }

  if (applyDefaults && !Object.prototype.hasOwnProperty.call(normalized, 'practicas')) {
    normalized.practicas = false;
  }

  if (normalized.autonomo && !normalized.tipo_trabajador) {
    normalized.tipo_trabajador = null;
  }

  if (normalized.revision_medica === false) {
    normalized.fecha_revision_medica = null;
  }

  if (normalized.nda_firmado === false && !normalized.nda_pdf_path) {
    normalized.nda_pdf_path = null;
  }

  if (normalized.permiso_b === false) {
    normalized.fecha_permiso_b = null;
  }

  if (normalized.tipo_trabajador === 'Prácticas') {
    normalized.practicas = true;
  }

  if (normalized.practicas === true) {
    normalized.cliente = null;
    normalized.desplazamiento = false;
    normalized.fecha_desplazamiento = null;
    normalized.a1 = false;
    normalized.fecha_a1 = null;
    normalized.fechafin_a1 = null;
    normalized.limosa = false;
    normalized.fecha_limosa = null;
    normalized.fechafin_limosa = null;
  }

  return normalized;
};

const formatSequelizeError = (err) => {
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors
      .map((error) => {
        if (error.type === 'unique violation') {
          return `${error.path} ya existe`;
        }
        return error.message;
      })
      .join('. ');
  }

  return err.message;
};

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
      ...normalizeTrabajadorPayload(req.body, { applyDefaults: true }),
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

    const trimmedEmpresa = typeof req.body.empresa === 'string'
      ? req.body.empresa.trim()
      : null;
    let empresaIdToSet = req.empresaId;
    if (trimmedEmpresa) {
      const empresaMatch = await Empresa.findOne({
        where: { nombre: trimmedEmpresa }
      });
      if (empresaMatch) {
        empresaIdToSet = empresaMatch.id;
      }
    }

    if (req.body.empresa_id && Number(req.body.empresa_id) !== empresaIdToSet) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    await trabajador.update({
      ...normalizeTrabajadorPayload(req.body),
      empresa_id: empresaIdToSet
    });
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

exports.uploadNda = async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
    if (trabajador.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Debe adjuntar el PDF del NDA' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'El NDA debe ser un archivo PDF' });
    }

    const workerFolder = sanitizeFolderName(trabajador.nombre);
    const ndaDir = path.join(INFO_DIR, workerFolder, 'NDA');
    const ndaPath = path.join(ndaDir, 'PDFdeNDA.pdf');

    await fs.mkdir(ndaDir, { recursive: true });
    await fs.writeFile(ndaPath, req.file.buffer);

    const relativePath = path.relative(path.join(__dirname, '..'), ndaPath).replace(/\\/g, '/');
    await trabajador.update({
      nda_firmado: true,
      nda_pdf_path: relativePath
    });

    res.json({
      message: 'NDA guardado correctamente',
      nda_firmado: trabajador.nda_firmado,
      nda_pdf_path: trabajador.nda_pdf_path
    });
  } catch (err) {
    res.status(400).json({ error: formatSequelizeError(err) });
  }
};

exports.downloadNda = async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
    if (trabajador.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    if (!trabajador.nda_pdf_path) {
      return res.status(404).json({ error: 'NDA no disponible' });
    }

    const baseDir = path.join(__dirname, '..');
    const ndaPath = path.resolve(baseDir, trabajador.nda_pdf_path);
    const infoRoot = path.resolve(INFO_DIR);
    const relativeToInfo = path.relative(infoRoot, ndaPath);

    if (relativeToInfo.startsWith('..') || path.isAbsolute(relativeToInfo)) {
      return res.status(400).json({ error: 'Ruta de NDA invalida' });
    }

    await fs.access(ndaPath);
    res.download(ndaPath, `${sanitizeFolderName(trabajador.nombre)}-NDA.pdf`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Archivo NDA no encontrado' });
    }
    res.status(400).json({ error: formatSequelizeError(err) });
  }
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
