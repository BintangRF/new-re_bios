const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Pasien = require("../models/pasien");
const nodemailer = require("nodemailer");

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
        user: "bintangrama777@gmail.com",
        pass: "ugsz ojzd yoev jbir",
      },
    });

    const mailOptions = {
      from: "bintangrama777@gmail.com",
      to: email_pasien,
      subject: "Appointment Confirmation",
      text: `Konsultasi Anda akan dilakukan bersama Dr. ${nama_psikolog} secara ${type} pada ${dayOfWeek}, ${appointmentDate.toLocaleDateString(
        "id-ID",
        { day: "numeric", month: "long", year: "numeric" }
      )} pukul ${waktu}.`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    const successMessage = "Appointment berhasil";
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
