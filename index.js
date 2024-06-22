const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const signupPost = require("./posts/signup");
const loginPost = require("./posts/login");
const appointmentPost = require("./posts/appointment");
const pembayaranPost = require("./posts/pembayaran");
const editprofilePost = require("./posts/edit_profile");
const profilePost = require("./posts/profile");
const paymentPost = require("./posts/payment");

const sequelize = require("./config/database");
const Pasien = require("./models/pasien");

// Untuk menghubungkan sequelize
sequelize
  .sync()
  .then(() => {
    console.log("Tabel telah disinkronkan dengan database.");
  })
  .catch((err) => {
    console.error("Gagal menyeimbangkan tabel:", err);
  });

// untuk mengirimkan menagakses data yang dikirimkan dari user
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Untuk menyimpan sesi login
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Untuk mengakses folder public
app.use(express.static("public"));

// Untuk mengakses folder views
app.use(express.static(path.join(__dirname, "views")));

// Untuk memeriksa kondisi login
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

// Routing
app.get("/", (req, res) => {
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "views", "index.html"),
    "utf8"
  );
  res.send(indexHtml);
});

// Route Dashboard
app.get("/index", (req, res) => {
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "views", "index.html"),
    "utf8"
  );
  res.send(indexHtml);
});

// Route index setelah login
app.get("/index2", checkLoggedIn, (req, res) => {
  if (req.session.email_pasien) {
    const email_pasien = req.session.email_pasien;
    Pasien.findOne({ where: { email_pasien: email_pasien } })
      .then((user) => {
        if (user) {
          const { nama_pasien, foto_pasien } = user;

          const namaPasienArray = nama_pasien.split(" ");
          const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

          const index2Html = fs.readFileSync(
            path.join(__dirname, "views", "index2.html"),
            "utf8"
          );
          const renderedHtml = index2Html
            .replace(/<%= nama_pendek %>/g, nama_pendek)
            .replace(/<%= foto_pasien %>/g, foto_pasien);

          res.send(renderedHtml);
        } else {
          res.redirect("/login");
        }
      })
      .catch((err) => {
        console.error("Kesalahan saat mencari data pasien:", err);
        res.status(500).send("Terjadi kesalahan saat mencari data pasien.");
      });
  } else {
  }
});

// Route Login
app.use("/", loginPost);

// Route Signup
app.use("/", signupPost);

// Route untuk Appointment
app.use("/", appointmentPost);

// Route untuk halaman pembayaran
app.use("/", pembayaranPost);

// Route untuk halaman profil
app.use("/", profilePost);

// Edit Profile
app.use("/", editprofilePost);

// Payment
app.use("/", paymentPost);

// Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/index");
  });
});

// checklogin
app.get("/check-login-status", (req, res) => {
  const isLoggedIn =
    req.session.userId && req.session.email_pasien ? true : false;
  res.json({ isLoggedIn });
});

// navbar
app.get("/navbar-before-login", (req, res) => {
  res.sendFile(__dirname + "/views/navbar.html");
});

// navbar
app.get("/navbar-after-login", async (req, res) => {
  try {
    const email_pasien = req.session.email_pasien;

    const pasien = await Pasien.findOne({
      where: {
        email_pasien: email_pasien,
      },
    });

    if (!pasien) {
      throw new Error("Pasien not found");
    }

    const namaPasienArray = pasien.nama_pasien.split(" ");
    const nama_pendek = namaPasienArray.slice(0, 2).join(" ");

    const navbar2Html = fs.readFileSync(
      path.join(__dirname, "views", "navbar2.html"),
      "utf8"
    );

    const renderedHtml = navbar2Html
      .replace(/<%= nama_pendek %>/g, nama_pendek)
      .replace(/<%= foto_pasien %>/g, pasien.foto_pasien);

    res.send(renderedHtml);
  } catch (error) {
    res.status(500).send("An error occurred: " + error.message);
  }
});

// Implementasi POST routes untuk form submission
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
