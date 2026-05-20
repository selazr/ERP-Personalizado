module.exports = (req, res, next) => {
  const rawId = req.headers['x-autonomo-id'];
  if (!rawId) {
    return res.status(400).json({ error: 'Autonomo requerido' });
  }

  const autonomoId = Number.parseInt(rawId, 10);
  if (Number.isNaN(autonomoId)) {
    return res.status(400).json({ error: 'Autonomo invalido' });
  }

  req.autonomoId = autonomoId;
  next();
};
