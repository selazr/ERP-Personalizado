const db = require('../models');
const Trabajador = db.Trabajador;
const Autonomo = db.Autonomo;

exports.getAll = async (req, res) => {
    try {
        const trabajadores = await Trabajador.findAll({
            where: { autonomo_id: req.autonomoId }
        });
        res.json(trabajadores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const trabajador = await Trabajador.findByPk(req.params.id);
        if (!trabajador) {
            return res.status(404).json({ error: 'No encontrado' });
        }

        if (trabajador.autonomo_id !== req.autonomoId) {
            return res.status(403).json({ error: 'Acceso no autorizado' });
        }

        res.json(trabajador);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        if (req.body.autonomo_id && Number(req.body.autonomo_id) !== req.autonomoId) {
            return res.status(403).json({ error: 'Acceso no autorizado' });
        }

        const nuevo = await Trabajador.create({
            ...req.body,
            autonomo_id: req.autonomoId
        });
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const trabajador = await Trabajador.findByPk(req.params.id);
        if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
        if (trabajador.autonomo_id !== req.autonomoId) {
            return res.status(403).json({ error: 'Acceso no autorizado' });
        }

        const trimmedAutonomo = typeof req.body.autonomo === 'string'
            ? req.body.autonomo.trim()
            : null;
        let autonomoIdToSet = req.autonomoId;
        if (trimmedAutonomo) {
            const autonomoMatch = await Autonomo.findOne({
                where: { nombre: trimmedAutonomo }
            });
            if (autonomoMatch) {
                autonomoIdToSet = autonomoMatch.id;
            }
        }

        if (req.body.autonomo_id && Number(req.body.autonomo_id) !== autonomoIdToSet) {
            return res.status(403).json({ error: 'Acceso no autorizado' });
        }

        await trabajador.update({ ...req.body, autonomo_id: autonomoIdToSet });
        res.json(trabajador);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const trabajador = await Trabajador.findByPk(req.params.id);
        if (!trabajador) return res.status(404).json({ error: 'No encontrado' });
        if (trabajador.autonomo_id !== req.autonomoId) {
            return res.status(403).json({ error: 'Acceso no autorizado' });
        }
        await trabajador.destroy();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Estadísticas y proyecciones de salarios
exports.getStats = async (req, res) => {
    try {
        const { Op } = db.Sequelize;
        const today = new Date();

        const totalTrabajadores = await Trabajador.count({
            where: { autonomo_id: req.autonomoId }
        });

        const trabajadoresActivos = await Trabajador.count({
            where: {
                autonomo_id: req.autonomoId,
                fecha_alta: { [Op.lte]: today },
                [Op.or]: [
                    { fecha_baja: null },
                    { fecha_baja: { [Op.gte]: today } }
                ]
            }
        });

        const trabajadoresInactivos = totalTrabajadores - trabajadoresActivos;

        const totalSalarioNeto = await Trabajador.sum('salario_neto', {
            where: { autonomo_id: req.autonomoId }
        }) || 0;
        const totalSalarioBruto = await Trabajador.sum('salario_bruto', {
            where: { autonomo_id: req.autonomoId }
        }) || 0;

        const salarioNetoPromedio = await Trabajador.findOne({
            attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('salario_neto')), 'promedio']],
            where: { autonomo_id: req.autonomoId }
        });
        const salarioBrutoPromedio = await Trabajador.findOne({
            attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('salario_bruto')), 'promedio']],
            where: { autonomo_id: req.autonomoId }
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

// Información de organización: trabajadores por autónomo y país,
// junto con los empleados con mayor antigüedad y varias estadísticas
// adicionales como nuevas incorporaciones, tipo de contrato, rol y
// resúmenes de horas trabajadas.
exports.getOrganizationInfo = async (req, res) => {
    try {
        const today = new Date();
        const { Op } = db.Sequelize;

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastQuarter = new Date();
        lastQuarter.setMonth(lastQuarter.getMonth() - 3);

        const activeCondition = {
            autonomo_id: req.autonomoId,
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

        const activeWorkers = await Trabajador.findAll({
            attributes: [
                'id',
                'nombre',
                'pais',
                'tipo_trabajador',
                'categoria',
                'fecha_alta',
                'fecha_baja'
            ],
            where: activeCondition,
            raw: true
        });

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
                    pais: w.pais,
                    categoria: w.categoria,
                    tipo_trabajador: w.tipo_trabajador,
                    fecha_alta: w.fecha_alta,
                    fecha_baja: w.fecha_baja
                });
            });
            return Object.values(groups).sort((a, b) => b.count - a.count);
        };

        const porAutonomo = activeWorkers.length > 0 ? [{
            autonomo: 'Autónomos',
            count: activeWorkers.length,
            workers: activeWorkers
        }] : [];
        const porPais = groupBy('pais', 'pais');
        const porContrato = groupBy('tipo_trabajador', 'tipo_trabajador');
        const porRol = groupBy('categoria', 'categoria');

        const veteranos = activeWorkers
            .map(v => ({
                id: v.id,
                nombre: v.nombre,
                autonomo: v.autonomo,
                tipo_trabajador: v.tipo_trabajador,
                fecha_alta: v.fecha_alta,
                fecha_baja: v.fecha_baja,
                antiguedad: Math.floor((today - new Date(v.fecha_alta)) / (365.25 * 24 * 60 * 60 * 1000))
            }))
            .sort((a, b) => new Date(a.fecha_alta) - new Date(b.fecha_alta))
            .slice(0, 5);

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

        const edadPromedioRow = await Trabajador.findOne({
            attributes: [[db.Sequelize.fn('AVG', db.Sequelize.literal('TIMESTAMPDIFF(YEAR, fecha_alta, CURDATE())')), 'promedio']],
            where: activeCondition,
            raw: true
        });
        const edadPromedio = parseFloat(edadPromedioRow.promedio || 0);

        res.json({
            totalTrabajadores: activeWorkers.length,
            porAutonomo,
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
            autonomoSeleccionado: req.autonomoId
        });
    } catch (err) {
        console.error('Error en getOrganizationInfo:', err);
        res.status(500).json({ error: err.message });
    }
};
