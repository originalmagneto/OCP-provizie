document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const referrer = document.getElementById("referrer").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: referrer, password }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = "index.html";
      } else {
        alert("Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login");
    }
  });
