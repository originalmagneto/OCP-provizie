async function loginNetlify(username, password) {
  try {
    const response = await fetch("/.netlify/functions/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    console.log("Login response status:", response.status);

    if (!response.ok) {
      console.error("Login failed. Status:", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Login failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Login response data:", data);

    if (data.success) {
      console.log("Login successful for user:", username);
      localStorage.setItem("currentUser", username);
      window.location.href = "index.html";
    } else {
      console.warn("Login failed. Reason:", data.message);
      alert("Invalid username or password");
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
