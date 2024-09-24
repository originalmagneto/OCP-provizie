document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginSection = document.getElementById("loginSection");
  const mainContent = document.getElementById("mainContent");
  const logoutBtn = document.getElementById("logoutBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");

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
        loginSection.style.display = "none";
        mainContent.style.display = "block";
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/logout", { method: "POST" });
      loginSection.style.display = "block";
      mainContent.style.display = "none";
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout");
    }
  });

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
});
