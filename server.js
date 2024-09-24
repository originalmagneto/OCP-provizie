const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require('pg');

const app = express();

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    console.error('Database connection error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      connectionString: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } else {
    console.log('Successfully connected to the database');
    console.log('Database connection details:', {
      user: pool.options.user,
      host: pool.options.host,
      database: pool.options.database,
      port: pool.options.port
    });
  }
});

const dotenv = require('dotenv');
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to database", err);
  } else {
    console.log("Database connected");
    initializeDatabase();
  }
});

function initializeDatabase() {
  pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT,
      requirePasswordChange BOOLEAN
    )`,
      (err) => {
        if (err) {
          console.error("Error creating users table:", err);
        } else {
          console.log("Users table created or already exists");
          checkAndInitializeDefaultUsers();
        }
      },
    );

    // Create invoices table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            month INTEGER,
            clientName TEXT,
            amount REAL,
            referrer TEXT,
            bonusPercentage REAL,
            paid INTEGER,
            createdBy TEXT
        )`,
      (err) => {
        if (err) {
          console.error("Error creating invoices table:", err);
        } else {
          console.log("Invoices table created or already exists");
        }
      },
    );

    // Create clients table if it doesn't exist



    db.run(
      `CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )`,
      (err) => {
        if (err) {
          console.error("Error creating clients table:", err);
        } else {
          console.log("Clients table created or already exists");
        }
      },
    );

    // Create quarterly_bonus_status table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS quarterly_bonus_status (
            referrer TEXT,
            year INTEGER,
            quarter INTEGER,
            paid INTEGER,
            PRIMARY KEY (referrer, year, quarter)
        )`,
      (err) => {
        if (err) {
          console.error("Error creating quarterly_bonus_status table:", err);
        } else {
          console.log("Quarterly bonus status table created or already exists");
        }
      },
    );
  });
}

function checkAndInitializeDefaultUsers() {
  const defaultUsers = [
    {
      username: "AdvokatiCHZ",
      password: "default123",
      requirePasswordChange: 1,
    },
    { username: "MKMs", password: "default123", requirePasswordChange: 1 },
    { username: "Contax", password: "default123", requirePasswordChange: 1 },
  ];

  db.all("SELECT username FROM users", [], (err, rows) => {
    if (err) {
      console.error("Error checking existing users:", err);
      return;
    }

    const existingUsernames = rows.map((row) => row.username);

    defaultUsers.forEach((user) => {
      if (!existingUsernames.includes(user.username)) {
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            db.run(
              "INSERT INTO users (username, password, requirePasswordChange) VALUES (?, ?, ?)",
              [user.username, hash, user.requirePasswordChange],
              (err) => {
                if (err) {
                  console.error(`Error inserting user ${user.username}:`, err);
                } else {
                  console.log(`User ${user.username} initialized`);
                }
              },
            );
          }
        });
      }
    });
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", username);

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Server error" });

      // Verify that the DATABASE_URL environment variable is correctly set
      // Check the Render dashboard under the Environment tab if issues persist

    }
    if (!user) {
      console.log("User not found:", username);
      return res.json({ success: false, message: "User not found" });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Password comparison error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
      if (result) {
        console.log("Successful login:", username);
        res.json({
          success: true,
          requirePasswordChange: user.requirePasswordChange === 1,
        });
      } else {
        console.log("Invalid password for user:", username);
        res.json({ success: false, message: "Invalid password" });
      }
    });
  });
});

app.post("/change-password", (req, res) => {
  const { username, newPassword } = req.body;
  console.log("Password change attempt for:", username);

  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
      console.error("Error hashing new password:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    db.run(
      "UPDATE users SET password = ?, requirePasswordChange = 0 WHERE username = ?",
      [hash, username],
      (err) => {
        if (err) {
          console.error("Error updating password:", err);
          return res
            .status(500)
            .json({ success: false, message: "Failed to update password" });
        }
        console.log(`Password updated successfully for user: ${username}`);
        res.json({ success: true });
      },
    );
  });
});

app.get("/get-invoices", (req, res) => {
  pool.query("SELECT * FROM invoices", (err, result) => {
    if (err) {
      console.error("Error fetching invoices:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
    console.log(`Successfully fetched ${result.rows.length} invoices`);
    res.json(result.rows);
  });
});

app.get("/get-client-names", async (req, res) => {
  console.log("Fetching client names...");
  try {
    const startTime = Date.now();
    const result = await pool.query("SELECT DISTINCT clientName FROM invoices");
    const clientNames = result.rows.map(row => row.clientName);
    const duration = Date.now() - startTime;
    console.log(`Successfully fetched ${clientNames.length} client names in ${duration}ms`);
    res.json(clientNames);
  } catch (err) {
    console.error("Error fetching client names:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
      timestamp: new Date().toISOString(),
      endpoint: "/get-client-names"
    });
  }
});

app.post("/save-invoice", (req, res) => {
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
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    query,
    [
      year,
      month,
      clientName,
      amount,
      referrer,
      bonusPercentage,
      paid ? 1 : 0,
      createdBy,
    ],
    function (err) {
      if (err) {
        console.error("Error saving invoice:", err);
        return res
          .status(500)
          .json({ error: "Failed to save invoice", details: err.message });
      }
      res.json({ success: true, id: this.lastID });
    },
  );
});

app.post("/save-client-name", (req, res) => {
  const { clientName } = req.body;
  db.run(
    "INSERT OR IGNORE INTO clients (name) VALUES (?)",
    [clientName],
    (err) => {
      if (err) {
        console.error("Error saving client name:", err);
        return res.status(500).json({ error: "Failed to save client name" });
      }
      res.json({ success: true });
    },
  );
});

app.put("/update-invoice/:id", (req, res) => {
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

  // Check if the user is authorized to update this invoice
  db.get("SELECT referrer FROM invoices WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error fetching invoice:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch invoice" });
    }
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }
    if (row.referrer !== currentUser) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this invoice",
        });
    }

    // If authorized, proceed with the update
    let query, params;
    if (paid !== undefined) {
      // If only updating paid status
      query = "UPDATE invoices SET paid = ? WHERE id = ?";
      params = [paid ? 1 : 0, id];
    } else {
      // If updating all invoice details
      query = `UPDATE invoices SET
                     year = ?, month = ?, clientName = ?, amount = ?,
                     referrer = ?, bonusPercentage = ?, paid = ?, createdBy = ?
                     WHERE id = ?`;
      params = [
        year,
        month,
        clientName,
        amount,
        referrer,
        bonusPercentage,
        paid ? 1 : 0,
        createdBy,
        id,
      ];
    }

    db.run(query, params, function (err) {
      if (err) {
        console.error("Error updating invoice:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update invoice" });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Invoice not found" });
      }
      res.json({ success: true });
    });
  });
});

app.delete("/delete-invoice/:id", (req, res) => {
  const { id } = req.params;
  const { createdBy } = req.query;

  db.run(
    "DELETE FROM invoices WHERE id = ? AND createdBy = ?",
    [id, createdBy],
    function (err) {
      if (err) {
        console.error("Error deleting invoice:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to delete invoice" });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Invoice not found or not authorized to delete",
          });
      }
      res.json({ success: true });
    },
  );
});

app.get("/quarterly-bonus-status", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM quarterly_bonus_status");
    const status = {};
    result.rows.forEach((row) => {
      if (!status[row.referrer]) {
        status[row.referrer] = {};
      }
      status[row.referrer][`${row.year}-${row.quarter}`] = row.paid === true;
    });
    console.log(`Successfully fetched quarterly bonus status for ${Object.keys(status).length} referrers`);
    res.json(status);
  } catch (err) {
    console.error("Error fetching quarterly bonus status:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.post("/update-quarterly-bonus-status", (req, res) => {
  const { referrer, year, quarter, isPaid } = req.body;
  const query = `INSERT OR REPLACE INTO quarterly_bonus_status (referrer, year, quarter, paid)
                   VALUES (?, ?, ?, ?)`;
  db.run(query, [referrer, year, quarter, isPaid ? 1 : 0], function (err) {
    if (err) {
      console.error("Error updating quarterly bonus status:", err);
      return res.status(500).json({ error: "Failed to update status" });
    }
    res.json({ success: true });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
