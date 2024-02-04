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
  nama_pasien: Sequelize.STRING,
  email_pasien: Sequelize.STRING,
  jumlah_biaya: Sequelize.INTEGER,
  tanggal_bayar: Sequelize.DATE,
  metode_pembayaran: Sequelize.STRING,
  status_bayar: Sequelize.STRING,
});

module.exports = Pembayaran;
