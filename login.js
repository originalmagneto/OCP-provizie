const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

// Use /tmp directory for the database file in Netlify Functions
const dbPath = path.join("/tmp", "users.db");
let db;
let databaseInitialized = false;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log("Initializing database...");
    console.log("Database path:", dbPath);

    // Check if the directory exists, if not create it
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error("Error opening database:", err);
          reject(err);
        } else {
          console.log("Database opened successfully");
          db.run(
            `CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          password TEXT,
          requirePasswordChange INTEGER
        )`,
            (err) => {
              if (err) {
                console.error("Error creating users table:", err);
                reject(err);
              } else {
                console.log("Users table created or already exists");
                checkAndInitializeDefaultUsers().then(resolve).catch(reject);
              }
            },
          );
        }
      },
    );
  });
}

function checkAndInitializeDefaultUsers() {
  return new Promise((resolve, reject) => {
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
        reject(err);
        return;
      }

      const existingUsernames = rows.map((row) => row.username);

      const promises = defaultUsers.map((user) => {
        if (!existingUsernames.includes(user.username)) {
          return new Promise((resolve, reject) => {
            bcrypt.hash(user.password, 10, (err, hash) => {
              if (err) {
                console.error("Error hashing password:", err);
                reject(err);
              } else {
                db.run(
                  "INSERT INTO users (username, password, requirePasswordChange) VALUES (?, ?, ?)",
                  [user.username, hash, user.requirePasswordChange],
                  (err) => {
                    if (err) {
                      console.error(
                        `Error inserting user ${user.username}:`,
                        err,
                      );
                      reject(err);
                    } else {
                      console.log(`User ${user.username} initialized`);
                      resolve();
                    }
                  },
                );
              }
            });
          });
        }
        return Promise.resolve();
      });

      Promise.all(promises).then(resolve).catch(reject);
    });
  });
}

exports.handler = async (event) => {
  console.log("Login function invoked");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Request body:", event.body);

  if (event.httpMethod !== "POST") {
    console.log("Invalid HTTP method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    if (!databaseInitialized) {
      try {
        await initializeDatabase();
        databaseInitialized = true;
        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Error initializing database:", error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Server error during initialization",
            details: error.message,
            stack: error.stack,
          }),
        };
      }
    }

    const { username, password } = JSON.parse(event.body);
    console.log("Login attempt for username:", username);

    return new Promise((resolve) => {
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, user) => {
          if (err) {
            console.error("Database error:", err);
            resolve({
              statusCode: 500,
              body: JSON.stringify({
                success: false,
                message: "Server error",
                error: err.message,
                stack: err.stack,
              }),
            });
            return;
          }
          if (!user) {
            console.log("User not found:", username);
            resolve({
              statusCode: 200,
              body: JSON.stringify({
                success: false,
                message: "Invalid username or password",
              }),
            });
            return;
          }

          console.log("User found, comparing passwords");
          bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
              console.error("Password comparison error:", err);
              resolve({
                statusCode: 500,
                body: JSON.stringify({
                  success: false,
                  message: "Server error",
                  error: err.message,
                  stack: err.stack,
                }),
              });
              return;
            }
            if (result) {
              console.log("Password match, login successful for:", username);
              resolve({
                statusCode: 200,
                body: JSON.stringify({
                  success: true,
                  requirePasswordChange: user.requirePasswordChange === 1,
                }),
              });
            } else {
              console.log("Password mismatch for user:", username);
              resolve({
                statusCode: 200,
                body: JSON.stringify({
                  success: false,
                  message: "Invalid username or password",
                }),
              });
            }
          });
        },
      );
    });
  } catch (error) {
    console.error("Unexpected error in login function:", error);
    console.error("Stack trace:", error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unexpected server error",
        details: error.message,
        stack: error.stack,
      }),
    };
  }
};
