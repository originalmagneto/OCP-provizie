const express = require("express");
const session = require("express-session");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname, ".")));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true },
  }),
);

// Initialize SQLite database
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected");
    initializeDatabase();
  }
});

// Initialize database tables
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
      paid BOOLEAN
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clientNames (
      name TEXT PRIMARY KEY
    )`);

    // Check if createdBy column exists and add it if it doesn't
    db.all(`PRAGMA table_info(invoices)`, (err, rows) => {
      if (err) {
        console.error("Error checking table info:", err);
        return;
      }

      const createdByExists = rows.some((row) => row.name === "createdBy");

      if (!createdByExists) {
        db.run(`ALTER TABLE invoices ADD COLUMN createdBy TEXT`, (alterErr) => {
          if (alterErr) {
            console.error("Error adding createdBy column:", alterErr);
          } else {
            console.log("Added createdBy column to invoices table");
          }
        });
      } else {
        console.log("createdBy column already exists in invoices table");
      }
    });
  });

  console.log("Database initialized");
}

// User authentication routes
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT passwordHash FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.status(400).json({ error: "Invalid username or password" });
      }
      const match = await bcrypt.compare(password, row.passwordHash);
      if (match) {
        req.session.user = username;
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid username or password" });
      }
    },
  );
});

app.post("/set-password", async (req, res) => {
  const { username, password } = req.body;
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  db.run(
    "INSERT OR REPLACE INTO users (username, passwordHash) VALUES (?, ?)",
    [username, passwordHash],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true });
    },
  );
});

// Invoice routes
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

  // Validate input
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

  // Validate data types
  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof amount !== "number" ||
    typeof bonusPercentage !== "number"
  ) {
    return res.status(400).json({ error: "Invalid data types" });
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

app.get("/get-invoices", (req, res) => {
  db.all("SELECT * FROM invoices", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// Client name routes
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

app.get("/get-client-names", (req, res) => {
  db.all("SELECT name FROM clientNames", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows.map((row) => row.name));
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
