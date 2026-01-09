module.exports = (sequelize, DataTypes) => {
  return sequelize.define('empresa', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    cif: { type: DataTypes.STRING, allowNull: true },
    direccion_fiscal: { type: DataTypes.STRING, allowNull: true },
    n_trabajadores: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    freezeTableName: true
  });
};
