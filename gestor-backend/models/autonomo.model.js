module.exports = (sequelize, DataTypes) => {
    return sequelize.define('autonomo', {
        nombre: { type: DataTypes.STRING, allowNull: false },
    }, {
        freezeTableName: true
    });
};
