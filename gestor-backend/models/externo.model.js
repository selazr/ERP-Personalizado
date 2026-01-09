module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'externo',
    {
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true,
      },
      nombre_empresa_externo: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      empresa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['fecha', 'nombre_empresa_externo', 'empresa_id'],
        },
      ],
    }
  );
};
