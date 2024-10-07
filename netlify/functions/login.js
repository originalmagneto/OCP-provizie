exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body);
  console.log("Attempting login for user:", username);

  try {
    // Here you would typically validate the username and password against your database
    // For this example, we'll use a mock authentication
    if (username === "admin" && password === "password") {
      console.log("Login successful for user:", username);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Login successful",
          requirePasswordChange: false,
        }),
      };
    } else {
      console.warn("Login failed for user:", username);
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

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log("Attempting login for user:", username);

    try {
      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Login successful for user:", username);
        localStorage.setItem("currentUser", username);
        window.location.href = "index.html";
      } else {
        console.warn("Login failed. Reason:", data.message);
        alert(data.message || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
