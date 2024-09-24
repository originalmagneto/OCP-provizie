const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
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

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    console.error("Database URL:", process.env.DATABASE_URL);
  } else {
    console.log("Successfully connected to the database");
  }
});

// Authentication middleware
const checkAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// Routes
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", username);

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    if (!user) {
      console.log("User not found:", username);
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log("Successful login:", username);
      req.session.user = { username: user.username };
      res.json({
        success: true,
        requirePasswordChange: user.requirepasswordchange,
      });
    } else {
      console.log("Invalid password for user:", username);
      res.json({ success: false, message: "Invalid password" });
    }
  } catch (err) {
    console.error("Database error:", err);
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

app.post("/change-password", checkAuth, async (req, res) => {
  const { newPassword } = req.body;
  const username = req.session.user.username;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, requirepasswordchange = false WHERE username = $2",
      [hashedPassword, username],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
});

app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Add other routes and API endpoints here...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
