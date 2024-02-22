const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const router = express.Router();
const Pembayaran = require("../models/pembayaran");

app.use(bodyParser.json());

router.post("/midtrans/webhook", (req, res) => {
  if (
    req.body.status_code === "200" &&
    req.body.transaction_status === "settlement"
  ) {
    const {
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
    } = req.body;

    Pembayaran.create({
      id_pasien,
      nama_pasien,
      email_pasien,
      jumlah_biaya,
      metode_pembayaran,
    })
      .then(() => {
        console.log("Data pembayaran berhasil disimpan ke database");
        res.status(200).end();
      })
      .catch((err) => {
        console.error("Error:", err);
        res.status(500).send("Terjadi kesalahan");
      });
  } else {
    res.status(200).end();
  }
});

module.exports = router;
