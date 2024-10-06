exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    // Here you would typically validate the username and password
    // For this example, we'll just check if they're not empty
    if (username && password) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          requirePasswordChange: false,
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid username or password",
        }),
      };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
