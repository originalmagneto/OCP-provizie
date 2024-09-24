const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Routes
app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "public", "login.html"));
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // For simplicity, we'll use a hardcoded password for all users
    const defaultPassword = "default123";

    if (password === defaultPassword) {
      req.session.user = { username };
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Invalid password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.json({ success: true });
  });
});

app.post("/change-password", async (req, res) => {
  if (!req.session.user) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  const { newPassword } = req.body;
  const username = req.session.user.username;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Here you would typically update the password in the database
    // For this example, we'll just log it
    console.log(`Password changed for user ${username}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
});

// Serve the main HTML file for authenticated users
app.get("/", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    res.redirect("/login");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
