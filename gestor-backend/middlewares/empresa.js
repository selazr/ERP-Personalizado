module.exports = (req, res, next) => {
  const rawId = req.headers['x-empresa-id'];
  if (!rawId) {
    return res.status(400).json({ error: 'Empresa requerida' });
  }

  const empresaId = Number.parseInt(rawId, 10);
  if (Number.isNaN(empresaId)) {
    return res.status(400).json({ error: 'Empresa inválida' });
  }

  req.empresaId = empresaId;
  next();
};
