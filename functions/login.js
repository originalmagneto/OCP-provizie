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

    // Hardcoded user for testing
    const testUser = {
      username: "AdvokatiCHZ",
      password: "default123",
      requirePasswordChange: true,
    };

    if (username === testUser.username && password === testUser.password) {
      console.log("Login successful for:", username);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          requirePasswordChange: testUser.requirePasswordChange,
          message: "Login successful",
        }),
      };
    } else {
      console.log("Login failed for:", username);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: "Invalid username or password",
        }),
      };
    }
  } catch (error) {
    console.error("Unexpected error in login function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unexpected server error",
        details: error.message,
      }),
    };
  }
};
