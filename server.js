const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected");
    checkAndUpdateDatabaseStructure();
  }
});

function checkAndUpdateDatabaseStructure() {
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error("Error checking table structure:", err);
      return;
    }

    if (rows.length === 0) {
      createUsersTable();
    } else {
      const columns = rows.map((row) => row.name);
      const requiredColumns = ["username", "password", "requirePasswordChange"];
      const missingColumns = requiredColumns.filter(
        (col) => !columns.includes(col),
      );

      if (missingColumns.length > 0) {
        alterUsersTable(missingColumns);
      } else {
        console.log("Users table structure is correct");
        initializeDefaultUsers();
      }
    }
  });
}

function createUsersTable() {
  db.serialize(() => {
    // Create users table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT,
        requirePasswordChange INTEGER
      )`,
      (err) => {
        if (err) {
          console.error("Error creating users table:", err);
        } else {
          console.log("Users table created or already exists");
        }
      },
    );

    // Create invoices table
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

    // Create clients table
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

    // Verify tables exist
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table'",
      [],
      (err, tables) => {
        if (err) {
          console.error("Error checking tables:", err);
        } else {
          console.log("Existing tables:", tables.map((t) => t.name).join(", "));
        }
      },
    );

    initializeDefaultUsers();
  });
}

function alterUsersTable(missingColumns) {
  missingColumns.forEach((column) => {
    db.run(
      `ALTER TABLE users ADD COLUMN ${column} ${column === "requirePasswordChange" ? "INTEGER" : "TEXT"}`,
      (err) => {
        if (err) {
          console.error(`Error adding column ${column}:`, err);
        } else {
          console.log(`Added column ${column} to users table`);
        }
      },
    );
  });
  initializeDefaultUsers();
}

function initializeDefaultUsers() {
  const defaultUsers = [
    {
      username: "AdvokatiCHZ",
      password: "default123",
      requirePasswordChange: 1,
    },
    { username: "MKMs", password: "default123", requirePasswordChange: 1 },
    { username: "Contax", password: "default123", requirePasswordChange: 1 },
  ];

  defaultUsers.forEach((user) => {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
      } else {
        db.run(
          "INSERT OR REPLACE INTO users (username, password, requirePasswordChange) VALUES (?, ?, ?)",
          [user.username, hash, user.requirePasswordChange],
          (err) => {
            if (err) {
              console.error(
                `Error inserting/updating user ${user.username}:`,
                err,
              );
            } else {
              console.log(`User ${user.username} initialized or updated`);
            }
          },
        );
      }
    });
  });
}

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for user: ${username}`);
  console.log(`Received password length: ${password.length}`);

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Database error during login:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.json({ success: false, message: "User not found" });
    }
    console.log(`User found: ${username}`);
    console.log(`Stored password hash length: ${user.password.length}`);
    console.log(`requirePasswordChange value: ${user.requirePasswordChange}`);

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
      if (result) {
        console.log(
          `Successful login for user: ${username}. Require password change: ${user.requirePasswordChange === 1}`,
        );
        console.log(
          `Login response: success: true, requirePasswordChange: ${user.requirePasswordChange === 1}`,
        );
        res.json({
          success: true,
          requirePasswordChange: user.requirePasswordChange === 1,
        });
      } else {
        console.log(`Invalid password for user: ${username}`);
        console.log(
          `Login response: success: false, message: "Invalid password"`,
        );
        res.json({ success: false, message: "Invalid password" });
      }
    });
  });
});

app.post("/change-password", (req, res) => {
  const { username, newPassword } = req.body;
  console.log(`Password change attempt for user: ${username}`);
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Database error during password change:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (!user) {
      console.log(`User not found during password change: ${username}`);
      return res.json({ success: false, message: "User not found" });
    }
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) {
        console.error("Error hashing new password:", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
      db.run(
        "UPDATE users SET password = ?, requirePasswordChange = 0 WHERE username = ?",
        [hash, username],
        function (err) {
          if (err) {
            console.error("Error updating password:", err);
            return res
              .status(500)
              .json({ success: false, message: "Failed to update password" });
          }
          if (this.changes === 0) {
            console.log(
              `No changes made during password update for user: ${username}`,
            );
            return res
              .status(400)
              .json({ success: false, message: "No changes made" });
          }
          console.log(`Password successfully updated for user: ${username}`);
          console.log(`requirePasswordChange set to 0 for user: ${username}`);
          res.json({ success: true, message: "Password updated successfully" });
        },
      );
    });
  });
});

app.get(["/login", "/"], (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/check-user/:username", (req, res) => {
  const username = req.params.username;
  db.get(
    "SELECT username, requirePasswordChange FROM users WHERE username = ?",
    [username],
    (err, user) => {
      if (err) {
        console.error("Error checking user:", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, user: user });
    },
  );
});

// Get invoices route
app.get("/get-invoices", (req, res) => {
  db.all("SELECT * FROM invoices", (err, rows) => {
    if (err) {
      console.error("Error fetching invoices:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get client names route
app.get("/get-client-names", (req, res) => {
  db.all("SELECT DISTINCT clientName FROM invoices", (err, rows) => {
    if (err) {
      console.error("Error fetching client names:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    const clientNames = rows.map((row) => row.clientName);
    res.json(clientNames);
  });
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

// Save client name route
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

// Update invoice route
app.put("/update-invoice/:id", (req, res) => {
  const id = req.params.id;
  const { paid } = req.body;
  const query = `UPDATE invoices SET paid = ? WHERE id = ?`;

  db.run(query, [paid ? 1 : 0, id], function (err) {
    if (err) {
      console.error("Error updating invoice:", err);
      return res
        .status(500)
        .json({ error: "Failed to update invoice", details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json({ success: true });
  });
});

console.log("Update invoice route added");

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
