exports.handler = async (event) => {
  console.log("Login function invoked");
  console.log("HTTP Method:", event.httpMethod);
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    console.log("Login attempt:", username);

    // Simulating database check and password comparison
    // In a real scenario, you'd query a database and use bcrypt to compare passwords
    if (username === "testuser" && password === "testpassword") {
      console.log("Successful login:", username);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          requirePasswordChange: false,
        }),
      };
    } else {
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
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
