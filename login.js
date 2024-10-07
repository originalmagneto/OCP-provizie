const bcrypt = require("bcrypt");

// Mock user data (replace this with your actual user authentication logic)
const users = {
  AdvokatiCHZ: {
    password: "$2b$10$X4kv7j5ZcG1pFV5sNvi6OeYoFrW9a6.rmA9X3uCNq3QhUCSrHAQTi",
    requirePasswordChange: false,
  },
  MKMs: {
    password: "$2b$10$X4kv7j5ZcG1pFV5sNvi6OeYoFrW9a6.rmA9X3uCNq3QhUCSrHAQTi",
    requirePasswordChange: false,
  },
  Contax: {
    password: "$2b$10$X4kv7j5ZcG1pFV5sNvi6OeYoFrW9a6.rmA9X3uCNq3QhUCSrHAQTi",
    requirePasswordChange: false,
  },
};

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    console.log(`Login attempt for user: ${username}`);

    if (!users[username]) {
      console.log(`User not found: ${username}`);
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid username or password",
        }),
      };
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      users[username].password,
    );

    if (isPasswordValid) {
      console.log(`Login successful for user: ${username}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          requirePasswordChange: users[username].requirePasswordChange,
        }),
      };
    } else {
      console.log(`Invalid password for user: ${username}`);
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid username or password",
        }),
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "An error occurred during login",
      }),
    };
  }
};
