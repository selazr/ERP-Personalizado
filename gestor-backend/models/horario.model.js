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
    vacaciones: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bajamedica: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    horanegativa: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    dianegativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pagada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    horas_pagadas: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0,
    },
    tipo_horas_pagadas: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proyecto_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    freezeTableName: true
  });
};
