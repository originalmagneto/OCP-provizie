async function loginNetlify(username, password) {
  console.log("Attempting login for user:", username);
  try {
    const response = await fetch("/.netlify/functions/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    console.log("Login response status:", response.status);

    const responseText = await response.text();
    console.log("Full response text:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error(`Failed to parse response: ${responseText}`);
    }

    console.log("Parsed login response data:", data);

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
}

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log("Attempting login for user:", username);
    await loginNetlify(username, password);
  });
