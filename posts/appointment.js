const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Pasien = require("../models/pasien");
const Psikolog = require("../models/psikolog");
const Appointment = require("../models/appointment");
const nodemailer = require("nodemailer");

require("dotenv").config();

function checkLoggedIn(req, res, next) {
  if (req.session.userId && req.session.email_pasien) {
    next();
  } else {
    const alertMessage = "Anda belum login. Silakan login terlebih dahulu.";
    const loginRedirect = "/login";

    res.send(`
      <script>
        alert('${alertMessage}');
        window.location='${loginRedirect}';
      </script>
    `);
  }
}

router.get("/appointment", checkLoggedIn, async (req, res) => {
  try {
    const email_pasien = req.session.email_pasien;

    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).send("Pasien tidak ditemukan");
    }

    const psikologOptions = await Psikolog.findAll();

    // Mendapatkan tanggal dari permintaan frontend atau gunakan tanggal hari ini sebagai default
    const tanggal = req.query.date
      ? req.query.date
      : new Date().toISOString().split("T")[0];

    // Mendapatkan nama psikolog dari permintaan frontend atau gunakan nama psikolog pertama sebagai default
    const nama_psikolog = req.query.psikolog
      ? req.query.psikolog
      : psikologOptions[0].nama_psikolog;

    // Memeriksa jadwal dokter pada tanggal yang dipilih
    const jadwalDokter = await Appointment.findAll({
      where: {
        nama_psikolog,
        tanggal: new Date(tanggal),
      },
    });

    const waktuTerpakai = jadwalDokter.map((jadwal) => jadwal.waktu);

    // Filter waktu terpakai sesuai dengan waktu yang sudah diambil oleh pengguna lain
    const waktuOptions = ["08:00", "10:00", "13:00", "15:00", "17:00"].filter(
      (option) => !waktuTerpakai.includes(option)
    );

    const psikologOptionsHtml = psikologOptions
      .map((psikolog) => {
        return `
        <option value="${psikolog.nama_psikolog}">
          ${psikolog.nama_psikolog}
        </option>
      `;
      })
      .join("");

    const waktuOptionsHtml = waktuOptions
      .map((waktu) => {
        return `
        <option value="${waktu}">
          ${waktu}
        </option>
      `;
      })
      .join("");

    const namaPasienArray = pasien.nama_pasien.split(" ");
    const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

    const appointmentHtml = fs.readFileSync(
      path.join(__dirname, "..", "views", "appointment.html"),
      "utf8"
    );

    const renderedHtml = appointmentHtml
      .replace(/<%= nama_pasien %>/g, pasien.nama_pasien)
      .replace(/<%= email_pasien %>/g, pasien.email_pasien)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien)
      .replace(/<%= psikologOptions %>/g, psikologOptionsHtml)
      .replace(/<%= waktuOptions %>/g, waktuOptionsHtml)
      .replace(/<%= nama_pendek %>/g, nama_pendek);
    res.send(renderedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

router.post("/appointment", async (req, res) => {
  try {
    const { nama_pasien, nama_psikolog, tanggal, waktu, type, keluhan } =
      req.body;

    const { email_pasien } = req.session;

    const pasien = await Pasien.findOne({
      where: { email_pasien },
    });

    if (!pasien) {
      return res.status(404).send("Pasien tidak ditemukan");
    }

    // Memeriksa batasan maksimal jadwal dokter
    const jumlahJadwalHariIni = await Appointment.count({
      where: {
        nama_psikolog,
        tanggal: new Date(tanggal),
      },
    });

    if (jumlahJadwalHariIni >= 5) {
      return res.send(
        "<script>alert('Dokter sudah memiliki maksimal jadwal hari ini')</script>" +
          "<script>window.history.back()</script>"
      );
    }
    // Memeriksa ketersediaan waktu
    const jadwalDokterHariIni = await Appointment.findAll({
      where: {
        nama_psikolog,
        tanggal: new Date(tanggal),
      },
    });

    const waktuTerpakai = jadwalDokterHariIni.map((jadwal) => jadwal.waktu);
    const waktuOptions = ["08:00", "10:00", "13:00", "15:00", "17:00"].filter(
      (option) => !waktuTerpakai.includes(option)
    );

    // Jika tidak ada waktu yang tersedia, kembalikan pesan kesalahan
    if (waktuOptions.length === 0) {
      return res.send(
        "<script>alert('Tidak ada waktu yang tersedia untuk hari ini')</script>" +
          "<script>window.history.back()</script>"
      );
    }

    await Appointment.create({
      nama_pasien,
      email_pasien,
      nama_psikolog,
      tanggal,
      waktu,
      type,
      keluhan,
      pasienId: pasien.id,
    });

    const appointmentDate = new Date(tanggal);
    const dayOfWeek = appointmentDate.toLocaleDateString("id-ID", {
      weekday: "long",
    });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.PASS,
      },
    });

    const paymentLink = process.env.PAYMENT_LINK;

    const mailOptions = {
      from: process.env.GMAIL,
      to: email_pasien,
      subject: "Appointment Confirmation",
      text: `Konsultasi Anda akan dilakukan bersama Dr. ${nama_psikolog} secara ${type} pada ${dayOfWeek}, ${appointmentDate.toLocaleDateString(
        "id-ID",
        { day: "numeric", month: "long", year: "numeric" }
      )} pukul ${waktu}. \nPayment Link: ${paymentLink}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    const successMessage = "Appointment berhasil. Silahkan Periksa Email Anda.";
    res.send(`
          <script>
            alert('${successMessage}');
            window.location='/index2';
          </script>
        `);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan");
  }
});

module.exports = router;
