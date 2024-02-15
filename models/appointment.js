const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Appointment = sequelize.define("tb_appointment", {
  id_appointment: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pasien: {
    type: Sequelize.INTEGER,
  },
  email_pasien: Sequelize.STRING,
  nama_pasien: Sequelize.STRING,
  nama_psikolog: Sequelize.STRING,
  tanggal: Sequelize.DATE,
  waktu: Sequelize.ENUM("08:00", "10:00", "13:00", "15:00", "17:00"),
  type: Sequelize.ENUM("voice call", "video call", "chat", "face to face"),
  keluhan: Sequelize.STRING,
});

module.exports = Appointment;
