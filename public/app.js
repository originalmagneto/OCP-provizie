document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginSection = document.getElementById("loginSection");
  const mainContent = document.getElementById("mainContent");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
          window.location.href = "/"; // Redirect to main page after successful login
        } else {
          alert(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login");
      }
    });
  }

  // Check if we're on the main page
  if (mainContent) {
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/logout", { method: "POST" });
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
        alert("An error occurred during logout");
      }
    });

    const changePasswordBtn = document.createElement("button");
    changePasswordBtn.textContent = "Change Password";
    changePasswordBtn.addEventListener("click", async () => {
      const newPassword = prompt("Enter new password:");
      if (newPassword) {
        try {
          const response = await fetch("/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword }),
          });

          const data = await response.json();
          if (data.success) {
            alert("Password changed successfully");
          } else {
            alert(data.message || "Failed to change password");
          }
        } catch (error) {
          console.error("Change password error:", error);
          alert("An error occurred while changing password");
        }
      }
    });

    mainContent.appendChild(logoutBtn);
    mainContent.appendChild(changePasswordBtn);
  }
});
