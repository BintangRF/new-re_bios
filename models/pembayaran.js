const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Pembayaran = sequelize.define("tb_pembayaran", {
  id_pembayaran: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pasien: {
    type: Sequelize.INTEGER,
  },
  bukti_pembayaran: Sequelize.BLOB,
  status_bayar: Sequelize.STRING,
});

module.exports = Pembayaran;
