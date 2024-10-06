const bcrypt = require("bcrypt");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join("/tmp", "users.db");
let db;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error("Error opening database:", err);
        reject(err);
      } else {
        console.log("Database opened successfully");
        resolve();
      }
    });
  });
}

exports.handler = async (event) => {
  console.log("Change password function invoked");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Change password function reached" })
  };
  console.log("Change password function invoked");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Event body:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Change password function reached",
      event: {
        httpMethod: event.httpMethod,
        body: event.body
      }
    })
  };
  console.log("Change password function invoked");
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
    console.log("Initializing database...");
    await initializeDatabase();
    console.log("Database initialized successfully");

    const { username, newPassword } = JSON.parse(event.body);
    console.log("Change password attempt for username:", username);

    console.log("Hashing new password...");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Password hashed successfully");

    console.log("Updating password in database...");
    const result = await new Promise((resolve, reject) => {
      db.run(
        "UPDATE users SET password = ?, requirePasswordChange = 0 WHERE username = ?",
        [hashedPassword, username],
        function (err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      console.log("No user found with username:", username);
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "User not found",
        }),
      };
    }

    console.log("Password updated successfully for:", username);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Password updated successfully",
      }),
    };
  } catch (error) {
    console.error("Error in change password function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
    };
  } finally {
    if (db) {
      console.log("Closing database connection...");
      db.close();
      console.log("Database connection closed");
    }
  }
};
  // Simulated user database
  const users = {
    AdvokatiCHZ: {
      password: "$2b$10$X4kv7j5ZcG2bYOvhHpgTBO0Hp/9zcfOLRXjI0tsf6IMI0kdSqsmZK",
      requirePasswordChange: true,
    },
    MKMs: {
      password: "$2b$10$X4kv7j5ZcG2bYOvhHpgTBO0Hp/9zcfOLRXjI0tsf6IMI0kdSqsmZK",
      requirePasswordChange: true,
    },
    Contax: {
      password: "$2b$10$X4kv7j5ZcG2bYOvhHpgTBO0Hp/9zcfOLRXjI0tsf6IMI0kdSqsmZK",
      requirePasswordChange: true,
    },
  };
  console.log("Change password function invoked");
  console.log("HTTP Method:", event.httpMethod);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    await initializeDatabase();

    const { username, newPassword } = JSON.parse(event.body);
    console.log("Change password attempt for username:", username);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return new Promise((resolve) => {
      db.run(
        "UPDATE users SET password = ?, requirePasswordChange = 0 WHERE username = ?",
        [hashedPassword, username],
        function (err) {
          if (err) {
            console.error("Error updating password:", err);
            resolve({
              statusCode: 500,
              body: JSON.stringify({
                success: false,
                message: "Failed to update password",
                error: err.message,
              }),
            });
          } else if (this.changes === 0) {
            console.log("No user found with username:", username);
            resolve({
              statusCode: 404,
              body: JSON.stringify({
                success: false,
                message: "User not found",
              }),
            });
          } else {
            console.log("Password updated successfully for:", username);
            resolve({
              statusCode: 200,
              body: JSON.stringify({
                success: true,
                message: "Password updated successfully",
              }),
            });
          }
        },
      );
    });
  } catch (error) {
    console.error("Unexpected error in change password function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unexpected server error",
        details: error.message,
      }),
    };
  } finally {
    if (db) {
      db.close();
    }
  }
};
