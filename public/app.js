document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.requirePasswordChange) {
            alert("Please change your password");
            // Redirect to password change page or show password change form
          } else {
            window.location.href = "/";
          }
        } else {
          alert(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login");
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("/logout", { method: "POST" });
        if (response.ok) {
          window.location.href = "/login";
        } else {
          alert("Logout failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
        alert("An error occurred during logout");
      }
    });
  }

  const changePasswordBtn = document.getElementById("changePasswordBtn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      const newPassword = prompt("Enter new password:");
      if (newPassword) {
        try {
          const response = await fetch("/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
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
  }
});
