// New server.js
const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const config = require("./config");

const app = express();

// Set up SQLite database connection
const db = new sqlite3.Database("./database.sqlite", (err) => {

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created or already exists');
      // Insert predefined users if they don't exist
      config.allowedUsers.forEach(user => {
        db.run('INSERT OR IGNORE INTO users (email, role) VALUES (?, ?)', [user.email, user.referrer], (err) => {
          if (err) console.error(`Error inserting user ${user.email}:`, err);
        });
      });
    }
  });

  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected");
    createTables();
  }
});

// Create entries table
db.run(
  `CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`,
  (err) => {
    if (err) {
      console.error("Error creating entries table", err);
    } else {
      console.log("Entries table created or already exists");
    }
  },
);

// Create tables if they don't exist
function createTables() {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`,
    (err) => {
      if (err) {
        console.error("Error creating users table", err);
      } else {
        console.log("Users table created or already exists");
      }
    },
  );
}

app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true },
  }),
);

// Test route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Test bcrypt
app.get("/test-bcrypt", async (req, res) => {
  try {
    const hash = await bcrypt.hash("test", 10);
    res.send(`Hash created: ${hash}`);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// User registration route
app.post("/register", async (req, res) => {
  const { email, password, referrer } = req.body;
  const allowedUser = config.allowedUsers.find(
    (user) => user.email === email && user.referrer === referrer,
  );

  if (!allowedUser) {
    return res.status(403).json({
      success: false,
      message: "Email and referrer combination not allowed to register",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, allowedUser.role],
      (err) => {
        if (err) {
          if (err.errno === 19) {
            // SQLite error code for unique constraint violation
            return res
              .status(409)
              .json({ success: false, message: "Email already exists" });
          }
          return res
            .status(500)
            .json({ success: false, message: "Error registering user" });
        }
        res.json({ success: true, message: "User registered successfully" });
      },
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Error hashing password" });
  }
});

// Login route
app.post("/login", (req, res) => {
  const { referrer, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE role = ?",
    [referrer],
    async (err, user) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }
      if (!user.password) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Password not set",
            requiresReset: true,
          });
      }
      try {
        if (await bcrypt.compare(password, user.password)) {
          req.session.userId = user.id;
          req.session.role = user.role;
          res.json({
            success: true,
            message: "Login successful",
            role: user.role,
          });
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

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Not authenticated" });
  }
};

// Create entry
app.post("/entries", isAuthenticated, (req, res) => {
  const { content } = req.body;
  db.run(
    "INSERT INTO entries (user_id, content) VALUES (?, ?)",
    [req.session.userId, content],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error creating entry" });
      }
      res.json({
        success: true,
        message: "Entry created successfully",
        entryId: this.lastID,
      });
    },
  );
});

// Read all entries
app.get("/entries", isAuthenticated, (req, res) => {
  db.all(
    "SELECT entries.*, users.email FROM entries JOIN users ON entries.user_id = users.id",
    (err, entries) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error fetching entries" });
      }
      res.json({ success: true, entries });
    },
  );
});

// Read single entry
app.get("/entries/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT entries.*, users.email FROM entries JOIN users ON entries.user_id = users.id WHERE entries.id = ?",
    [id],
    (err, entry) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error fetching entry" });
      }
      if (!entry) {
        return res
          .status(404)
          .json({ success: false, message: "Entry not found" });
      }
      res.json({ success: true, entry });
    },
  );
});

// Update entry
app.put("/entries/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  db.run(
    "UPDATE entries SET content = ? WHERE id = ? AND user_id = ?",
    [content, id, req.session.userId],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error updating entry" });
      }
      if (this.changes === 0) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this entry",
        });
      }
      res.json({ success: true, message: "Entry updated successfully" });
    },
  );
});

// Delete entry
app.delete("/entries/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  db.run(
    "DELETE FROM entries WHERE id = ? AND user_id = ?",
    [id, req.session.userId],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error deleting entry" });
      }
      if (this.changes === 0) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this entry",
        });
      }
      res.json({ success: true, message: "Entry deleted successfully" });
    },
  );
});

// Set-password route
app.post("/set-password", async (req, res) => {
  const { referrer, password, newPassword } = req.body;

  db.get(
    "SELECT * FROM users WHERE role = ?",
    [referrer],
    async (err, user) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      try {
        // If the user already has a password, verify it before allowing change
        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({
              success: false,
              message: "Current password is incorrect",
            });
          }
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        db.run(
          "UPDATE users SET password = ? WHERE role = ?",
          [hashedNewPassword, referrer],
          (updateErr) => {
            if (updateErr) {
              return res
                .status(500)
                .json({ success: false, message: "Error updating password" });
            }
            res.json({
              success: true,
              message: "Password set/updated successfully",
            });
          },
        );
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Error processing password" });
      }
    },
  );
});

// Password reset route
app.post("/reset-password", async (req, res) => {
  const { referrer, newPassword } = req.body;

  if (!referrer || !newPassword) {
    return res.status(400).json({ success: false, message: "Referrer and new password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run(
      "UPDATE users SET password = ? WHERE role = ?",
      [hashedPassword, referrer],
      function (err) {
        if (err) {
          console.error("Database error during password reset:", err);
          return res.status(500).json({
            success: false,
            message: "Error resetting password",
            error: err.message
          });
        }
        if (this.changes === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "Password reset successfully" });
      }
    );
  } catch (error) {
    console.error("Error processing password reset:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset",
      error: error.message
    });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
