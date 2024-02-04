const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const Pasien = require("../models/pasien");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(express.static("public"));

router.post("/signup", upload.single("foto_pasien"), async (req, res) => {
  try {
    const {
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password,
    } = req.body;

    const foto_pasien = req.file
      ? req.file.buffer
      : await getDefaultProfileImage();

    const fotoFileName = "poto-profil.png";
    const fotoPath = path.join(__dirname, "../public/uploads/", fotoFileName);

    await fs.writeFile(fotoPath, foto_pasien);

    const newPasien = await Pasien.create({
      nama_pasien,
      tanggal_lahir,
      gender,
      nomor_ponsel,
      email_pasien,
      alamat,
      password,
      foto_pasien: `${fotoFileName}`,
    });

    const successMessage = "Pendaftaran berhasil";
    res.send(`
      <script>
        alert('${successMessage}');
        window.location='/login'; // Change '/login' to your login URL
      </script>
    `);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Pendaftaran gagal. Coba lagi nanti.");
  }
});

async function getDefaultProfileImage() {
  try {
    const defaultImagePath = path.join(
      __dirname,
      "../public/uploads/poto-profil.png"
    );
    const defaultImageBuffer = await fs.readFile(defaultImagePath);
    return defaultImageBuffer;
  } catch (error) {
    console.error("Error reading default profile image:", error);
    throw error;
  }
}

module.exports = router;
