const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

async function initializeDatabase() {
  const tables = [
    "CREATE TABLE IF NOT EXISTS users (" +
      "username TEXT PRIMARY KEY," +
      "password TEXT," +
      "requirePasswordChange BOOLEAN" +
      ")",
    "CREATE TABLE IF NOT EXISTS invoices (" +
      "id SERIAL PRIMARY KEY," +
      "year INTEGER," +
      "month INTEGER," +
      "clientName TEXT," +
      "amount REAL," +
      "referrer TEXT," +
      "bonusPercentage REAL," +
      "paid BOOLEAN," +
      "createdBy TEXT" +
      ")",
    "CREATE TABLE IF NOT EXISTS clients (" +
      "id SERIAL PRIMARY KEY," +
      "name TEXT UNIQUE" +
      ")",
    "CREATE TABLE IF NOT EXISTS quarterly_bonus_status (" +
      "referrer TEXT," +
      "year INTEGER," +
      "quarter INTEGER," +
      "paid BOOLEAN," +
      "PRIMARY KEY (referrer, year, quarter)" +
      ")",
  ];

  try {
    for (const table of tables) {
      await pool.query(table);
    }
    console.log("Database tables created or already exist");
    await checkAndInitializeDefaultUsers();
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

async function checkAndInitializeDefaultUsers() {
  const defaultUsers = [
    {
      username: "AdvokatiCHZ",
      password: "default123",
      requirePasswordChange: true,
    },
    { username: "MKMs", password: "default123", requirePasswordChange: true },
    { username: "Contax", password: "default123", requirePasswordChange: true },
  ];

  try {
    const result = await pool.query("SELECT username FROM users");
    const existingUsernames = result.rows.map((row) => row.username);

    for (const user of defaultUsers) {
      if (!existingUsernames.includes(user.username)) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          "INSERT INTO users (username, password, requirePasswordChange) VALUES ($1, $2, $3)",
          [user.username, hashedPassword, user.requirePasswordChange],
        );
        console.log(`User ${user.username} initialized`);
      }
    }
  } catch (err) {
    console.error("Error initializing default users:", err);
  }
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", username);

  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
  });

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

app.post("/change-password", async (req, res) => {
  const { username, newPassword } = req.body;
  console.log("Password change attempt for:", username);

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, requirePasswordChange = false WHERE username = $2",
      [hashedPassword, username],
    );
    console.log(`Password updated successfully for user: ${username}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating password:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update password" });
  }
});

app.get("/get-invoices", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM invoices");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/get-client-names", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT clientName FROM invoices");
    const clientNames = result.rows.map((row) => row.clientName);
    res.json(clientNames);
  } catch (err) {
    console.error("Error fetching client names:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/save-invoice", async (req, res) => {
  const {
    year,
    month,
    clientName,
    amount,
    referrer,
    bonusPercentage,
    paid,
    createdBy,
  } = req.body;
  const query = `INSERT INTO invoices (year, month, clientName, amount, referrer, bonusPercentage, paid, createdBy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
  try {
    const result = await pool.query(query, [
      year,
      month,
      clientName,
      amount,
      referrer,
      bonusPercentage,
      paid,
      createdBy,
    ]);
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("Error saving invoice:", err);
    res
      .status(500)
      .json({ error: "Failed to save invoice", details: err.message });
  }
});

app.post("/save-client-name", async (req, res) => {
  const { clientName } = req.body;
  try {
    await pool.query(
      "INSERT INTO clients (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [clientName],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving client name:", err);
    res.status(500).json({ error: "Failed to save client name" });
  }
});

app.put("/update-invoice/:id", async (req, res) => {
  const { id } = req.params;
  const {
    paid,
    year,
    month,
    clientName,
    amount,
    referrer,
    bonusPercentage,
    createdBy,
  } = req.body;
  const currentUser = req.body.currentUser;

  try {
    const checkResult = await pool.query(
      "SELECT referrer FROM invoices WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }
    if (checkResult.rows[0].referrer !== currentUser) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this invoice",
      });
    }

    let query, params;
    if (paid !== undefined) {
      query = "UPDATE invoices SET paid = $1 WHERE id = $2";
      params = [paid, id];
    } else {
      query = `UPDATE invoices SET
               year = $1, month = $2, clientName = $3, amount = $4,
               referrer = $5, bonusPercentage = $6, paid = $7, createdBy = $8
               WHERE id = $9`;
      params = [
        year,
        month,
        clientName,
        amount,
        referrer,
        bonusPercentage,
        paid,
        createdBy,
        id,
      ];
    }

    const result = await pool.query(query, params);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating invoice:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update invoice" });
  }
});

app.delete("/delete-invoice/:id", async (req, res) => {
  const { id } = req.params;
  const { createdBy } = req.query;

  try {
    const result = await pool.query(
      "DELETE FROM invoices WHERE id = $1 AND createdBy = $2",
      [id, createdBy],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or not authorized to delete",
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting invoice:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete invoice" });
  }
});

app.get("/quarterly-bonus-status", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM quarterly_bonus_status");
    const status = {};
    result.rows.forEach((row) => {
      if (!status[row.referrer]) {
        status[row.referrer] = {};
      }
      status[row.referrer][`${row.year}-${row.quarter}`] = row.paid;
    });
    res.json(status);
  } catch (err) {
    console.error("Error fetching quarterly bonus status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/update-quarterly-bonus-status", async (req, res) => {
  const { referrer, year, quarter, isPaid } = req.body;
  const query = `INSERT INTO quarterly_bonus_status (referrer, year, quarter, paid)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (referrer, year, quarter) DO UPDATE SET paid = $4`;
  try {
    await pool.query(query, [referrer, year, quarter, isPaid]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating quarterly bonus status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
