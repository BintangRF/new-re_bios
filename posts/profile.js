const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Pasien = require("../models/pasien");
const multer = require("multer"); // Untuk menangani upload file
const Appointment = require("../models/appointment");
const Pembayaran = require("../models/pembayaran");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

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

router.get("/profile", async (req, res) => {
  if (req.session.email_pasien) {
    const email_pasien = req.session.email_pasien;
    const id_pasien = req.session.id_pasien;

    const query = id_pasien ? { id_pasien, email_pasien } : { email_pasien };

    try {
      const user = await Pasien.findOne({ where: query });

      if (user) {
        const {
          id_pasien,
          nama_pasien,
          email_pasien,
          gender,
          nomor_ponsel,
          alamat,
          foto_pasien,
        } = user;

        const pembayaran = await Pembayaran.findOne({ where: { id_pasien } });

        const namaPasienArray = nama_pasien.split(" ");
        const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

        const profileData = {
          id_pasien: id_pasien,
          nama_pasien: nama_pasien,
          email_pasien: email_pasien,
          gender: gender,
          nomor_ponsel: nomor_ponsel,
          alamat: alamat,
          foto_pasien: foto_pasien,
          jumlah_bayar: pembayaran ? pembayaran.jumlah_bayar : "-",
          status_bayar: pembayaran ? pembayaran.status_bayar : "-",
          nama_pendek: nama_pendek,
          tanggal_appointment: "-",
          waktu_appointment: "-",
        };

        const profileHtml = fs.readFileSync(
          path.join(__dirname, "..", "views", "profile.html"),
          "utf8"
        );

        const appointment = await Appointment.findOne({
          where: { email_pasien },
          order: [
            ["tanggal", "DESC"],
            ["waktu", "DESC"],
          ],
        });

        if (appointment) {
          if (pembayaran) {
            profileData.jumlah_bayar = 80000;
            profileData.status_bayar = "Sudah";
          } else {
            profileData.jumlah_bayar = 80000;
            profileData.status_bayar = "Upload Bukti Pembayaran";
          }
          const appointmentDate = new Date(appointment.tanggal);

          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];

          const day = appointmentDate.getDate();
          const month = monthNames[appointmentDate.getMonth()];
          const year = appointmentDate.getFullYear();

          const formattedDate = `${appointmentDate
            .toDateString()
            .substr(0, 3)} ${month} ${day} ${year}`;
          profileData.tanggal_appointment = formattedDate;
          profileData.waktu_appointment = appointment.waktu;
        } else {
          profileData.jumlah_bayar = "-";
          profileData.status_bayar = "-";
          profileData.tanggal_appointment = "Anda belum memiliki appointment";
          profileData.waktu_appointment = "";
        }

        const renderedHtml = profileHtml
          .replace(/<%= profileData.id_pasien %>/g, profileData.id_pasien)
          .replace(/<%= profileData.nama_pasien %>/g, profileData.nama_pasien)
          .replace(/<%= profileData.email_pasien %>/g, profileData.email_pasien)
          .replace(/<%= profileData.gender %>/g, profileData.gender)
          .replace(/<%= profileData.nomor_ponsel %>/g, profileData.nomor_ponsel)
          .replace(/<%= profileData.alamat %>/g, profileData.alamat)
          .replace(/<%= profileData.foto_pasien %>/g, profileData.foto_pasien)
          .replace(/<%= profileData.jumlah_bayar %>/g, profileData.jumlah_bayar)
          .replace(/<%= profileData.status_bayar %>/g, profileData.status_bayar)
          .replace(/<%= profileData.nama_pendek %>/g, profileData.nama_pendek)
          .replace(
            /<%= profileData.tanggal_appointment %>/g,
            `tanggal: ${profileData.tanggal_appointment}`
          )
          .replace(
            /<%= profileData.waktu_appointment %>/g,
            `waktu: ${profileData.waktu_appointment}`
          );

        res.send(renderedHtml);
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      console.error("Kesalahan saat mencari data pasien:", error);
      res.status(500).send("Terjadi kesalahan saat mencari data pasien.");
    }
  } else {
    res.redirect("/login");
  }
});

router.post("/profile", upload.single("bukti_pembayaran"), async (req, res) => {
  try {
    // Pastikan ada file yang diunggah
    if (!req.file) {
      res.send(`
        <script>
          alert('Siilahkan Upload Bukti Pembayaran Terlebih Dahulu');
        </script>
      `);
    }

    const id_pasien = req.body.id_pasien;
    const bukti_pembayaran = req.file.filename; // Nama file yang diupload

    // Lakukan proses penyimpanan bukti pembayaran ke database atau penyimpanan yang diperlukan
    await Pembayaran.create({
      id_pasien,
      bukti_pembayaran,
      status_bayar: "Sudah",
    });

    const successMessage = "Bukti pembayaran berhasil diupload";
    res.send(`
        <script>
          alert('${successMessage}');
          window.location='/profile';
        </script>
      `); // Redirect kembali ke halaman profile setelah upload berhasil
  } catch (error) {
    console.error("Kesalahan saat upload bukti pembayaran:", error);
    res.status(500).send("Terjadi kesalahan saat upload bukti pembayaran.");
  }
});

module.exports = router;
