let bcrypt;
try {
  console.log("Attempting to import bcrypt module...");
  bcrypt = require("bcrypt");
  console.log("bcrypt module imported successfully");
} catch (error) {
  console.error("Failed to import bcrypt:", error.message);
  console.error("Error stack:", error.stack);
  console.error("Node.js version:", process.version);
  console.error("Please check if bcrypt is installed correctly and compatible with the current Node.js version.");
  throw new Error("bcrypt module import failed");
}
  console.log("bcrypt module imported successfully");
} catch (error) {
  console.error("Failed to import bcrypt:", error.message);
  console.error("Please check if bcrypt is installed correctly.");
  throw new Error("bcrypt module not found");
}

// Add error handling for bcrypt import
if (!bcrypt) {
  console.error(
    "Failed to import bcrypt. Please check if it's installed correctly.",
  );
  throw new Error("bcrypt module not found");
}

// Add logging for successful import
console.log("bcrypt module imported successfully");

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
  console.log("Function invoked");
  console.log("Event:", JSON.stringify(event, null, 2));

  if (event.httpMethod !== "POST") {
    console.log("Method not allowed");
    return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
  }

  try {
    console.log("Parsing request body");
    const { username, password } = JSON.parse(event.body);

    console.log(`Login attempt for user: ${username}`);

    // Simplified authentication (replace with actual logic later)
    if (username === "test" && password === "password") {
      console.log(`Login successful for user: ${username}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          requirePasswordChange: false,
        }),
      };
    } else {
      console.log(`Invalid credentials for user: ${username}`);
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
        error: error.toString(),
      }),
    };
  }
};
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

exports.handler = async function (event) {
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

    // Simple password comparison (not secure, for demonstration only)
    const isPasswordValid = password === "password123";

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
