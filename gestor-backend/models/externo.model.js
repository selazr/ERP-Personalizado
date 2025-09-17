module.exports = (sequelize, DataTypes) => {
  return sequelize.define('externo', {
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true,
    },
    nombre_empresa_externo: {
      type: DataTypes.STRING,
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
