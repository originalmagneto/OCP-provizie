const express = require("express");
const session = require("express-session");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true },
  }),
);

// Database setup
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected");
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      passwordHash TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER,
      month INTEGER,
      clientName TEXT,
      amount REAL,
      referrer TEXT,
      bonusPercentage REAL,
      paid BOOLEAN,
      createdBy TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clientNames (
      name TEXT PRIMARY KEY
    )`);

    console.log("Database initialized");
  });
}

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT passwordHash FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (!row) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }
      try {
        if (await bcrypt.compare(password, row.passwordHash)) {
          req.session.user = username;
          res.json({ success: true, message: "Login successful" });
        } else {
          res
            .status(401)
            .json({ success: false, message: "Incorrect password" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Error comparing passwords" });
      }
    },
  );
});

// Change password route
app.post("/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  db.get(
    "SELECT passwordHash FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (!row) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }
      try {
        const match = await bcrypt.compare(currentPassword, row.passwordHash);
        if (!match) {
          return res
            .status(400)
            .json({ success: false, message: "Current password is incorrect" });
        }
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        db.run(
          "UPDATE users SET passwordHash = ? WHERE username = ?",
          [newPasswordHash, username],
          (err) => {
            if (err) {
              console.error("Error updating password:", err);
              return res
                .status(500)
                .json({ success: false, message: "Error updating password" });
            }
            res.json({
              success: true,
              message: "Password updated successfully",
            });
          },
        );
      } catch (error) {
        console.error("Bcrypt error:", error);
        res
          .status(500)
          .json({ success: false, message: "Error processing password" });
      }
    },
  );
});

// Save invoice route
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

  if (
    !year ||
    !month ||
    !clientName ||
    !amount ||
    !referrer ||
    bonusPercentage === undefined ||
    paid === undefined ||
    !createdBy
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    "INSERT INTO invoices (year, month, clientName, amount, referrer, bonusPercentage, paid, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      year,
      month,
      clientName,
      amount,
      referrer,
      bonusPercentage,
      paid,
      createdBy,
    ],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      res.json({ success: true });
    },
  );
});

// Get invoices route
app.get("/get-invoices", (req, res) => {
  db.all("SELECT * FROM invoices", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// Update invoice route
app.put("/update-invoice/:id", (req, res) => {
  const { id } = req.params;
  const updateFields = [];
  const updateValues = [];
  const allowedFields = [
    "year",
    "month",
    "clientName",
    "amount",
    "referrer",
    "bonusPercentage",
    "paid",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      updateValues.push(req.body[field]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  updateValues.push(id);
  updateValues.push(req.body.createdBy);

  const query = `UPDATE invoices SET ${updateFields.join(", ")} WHERE id = ? AND createdBy = ?`;

  db.run(query, updateValues, function (err) {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (this.changes === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this invoice" });
    }
    res.json({ success: true });
  });
});

// Delete invoice route
app.delete("/delete-invoice/:id", (req, res) => {
  const { id } = req.params;
  const { createdBy } = req.query;
  db.run(
    "DELETE FROM invoices WHERE id = ? AND createdBy = ?",
    [id, createdBy],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this invoice" });
      }
      res.json({ success: true });
    },
  );
});

// Save client name route
app.post("/save-client-name", (req, res) => {
  const { clientName } = req.body;
  db.run(
    "INSERT OR IGNORE INTO clientNames (name) VALUES (?)",
    [clientName],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true });
    },
  );
});

// Get client names route
app.get("/get-client-names", (req, res) => {
  db.all("SELECT name FROM clientNames", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows.map((row) => row.name));
  });
});

// Temporary route to check user data
app.get("/check-user/:username", (req, res) => {
  const { username } = req.params;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ username: row.username, passwordHash: row.passwordHash });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
