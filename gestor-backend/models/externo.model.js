module.exports = (sequelize, DataTypes) => {
  return sequelize.define('externo', {
    fecha: {
      type: DataTypes.DATEONLY,
      primaryKey: true,
      allowNull: false,
    },
    nombre_empresa_externo: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
    timestamps: false,
  });
};
