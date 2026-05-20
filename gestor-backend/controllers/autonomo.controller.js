const db = require('../models');
const autonomo = db.Autonomo;

exports.getAll = async (req, res) => {
    try {
        const autonomos = await autonomo.findAll({
            attributes: ['id', 'nombre'],
            order: [['nombre', 'ASC']]
        });
        res.json(autonomos);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo autonomos'});
    }
};