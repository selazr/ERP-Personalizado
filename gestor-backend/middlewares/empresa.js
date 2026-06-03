module.exports = (req, res, next) => {
  const rawEmpresaId = req.headers['x-empresa-id'];
  const rawAutonomoId = req.headers['x-autonomo-id'];

  if (!rawEmpresaId && !rawAutonomoId) {
    return res.status(400).json({ error: 'Empresa o Autónomo requerido' });
  }

  if (rawEmpresaId) {
    const empresaId = Number.parseInt(rawEmpresaId, 10);
    if (Number.isNaN(empresaId)) {
      return res.status(400).json({ error: 'Empresa inválida' });
    }
    req.empresaId = empresaId;
  }

  if (rawAutonomoId) {
    const autonomoId = Number.parseInt(rawAutonomoId, 10);
    if (Number.isNaN(autonomoId)) {
      return res.status(400).json({ error: 'Autónomo inválido' });
    }
    req.autonomoId = autonomoId;
  }

  next();
};
