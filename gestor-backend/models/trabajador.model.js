module.exports = (sequelize, DataTypes) => {
  return sequelize.define('trabajador', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    dni: { type: DataTypes.STRING, unique: true, allowNull: false },
    correo_electronico: { type: DataTypes.STRING, unique: true, allowNull: false },
    telefono: DataTypes.STRING,
    tipo_trabajador: { type: DataTypes.STRING, allowNull: false },
    grupo: DataTypes.STRING,
    categoria: DataTypes.STRING,
    iban: DataTypes.STRING,
    nss: DataTypes.STRING,
    fecha_alta: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_baja: DataTypes.DATEONLY,
    horas_contratadas: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    salario_neto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    salario_bruto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    direccion: DataTypes.STRING,
    desplazamiento: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_desplazamiento: DataTypes.DATEONLY,
    cliente: DataTypes.STRING,
    a1: { type: DataTypes.BOOLEAN, defaultValue: false },
    limosa: { type: DataTypes.BOOLEAN, defaultValue: false },
    pais: DataTypes.STRING,
    empresa: DataTypes.STRING,
    epis: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_epis: DataTypes.DATEONLY,
    fecha_limosa: DataTypes.DATEONLY,
    fechafin_limosa: DataTypes.DATEONLY,
    fecha_a1: DataTypes.DATEONLY,
    fechafin_a1: DataTypes.DATEONLY,
    condiciones: DataTypes.TEXT
  }, {
    freezeTableName: true // 👈 esto evita la pluralización (Trabajadors)
  });
};
