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
    const { username, password } = JSON.parse(event.body);
    console.log("Login attempt for username:", username);

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
          }),
        };
      }
    }

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
      }),
    };
  }
};
