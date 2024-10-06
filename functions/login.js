exports.handler = async (event) => {
  console.log("Login function invoked");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Request body:", event.body);
  if (event.httpMethod !== "POST") {
    console.log("Invalid HTTP method:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    console.log("Login attempt for username:", username);

    if (!databaseInitialized) {
      try {
        await initializeDatabase();
        databaseInitialized = true;
        console.log("Database initialized");
      } catch (error) {
        console.error("Error initializing database:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Server error during initialization" }) };
      }
    }

    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
          console.error("Database error:", err);
          resolve({ statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) });
        }
        if (!user) {
          console.log("User not found:", username);
          resolve({ statusCode: 200, body: JSON.stringify({ success: false, message: "Invalid username or password" }) });
        } else {
          console.log("User found, comparing passwords");
          bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
              console.error("Password comparison error:", err);
              resolve({ statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) });
            }
            if (result) {
              console.log("Password match, login successful for:", username);
              resolve({
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          requirePasswordChange: false,
        }),
      };
    } else {
      console.log("Credential mismatch for user:", username);
      console.log("Invalid credentials for user:", username);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: "Invalid username or password",
        }),
      };
    }
  } catch (error) {
    console.error("Error in login function:", error);
    console.error("Stack trace:", error.stack);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
