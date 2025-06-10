// src/models/schedule.model.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('schedule', {
    trabajador_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trabajador',
        key: 'id'
      }
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    festivo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    freezeTableName: true,
    timestamps: true
  });
};
