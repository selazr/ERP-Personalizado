module.exports = (sequelize, DataTypes) => {
  return sequelize.define('horario', {
    trabajador_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trabajador',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    festivo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    proyecto_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    freezeTableName: true
  });
};
