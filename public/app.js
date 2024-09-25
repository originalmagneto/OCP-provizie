document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginSection = document.getElementById("loginSection");
  const mainContent = document.getElementById("mainContent");
  const logoutBtn = document.getElementById("logoutBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");

  const showError = (message) => {
    alert(message);
  };

  const handleLogin = async (e) => {
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
        showError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("An error occurred during login");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "POST" });
      loginSection.style.display = "block";
      mainContent.style.display = "none";
    } catch (error) {
      console.error("Logout error:", error);
      showError("An error occurred during logout");
    }
  };

  const handleChangePassword = async () => {
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
          showError(data.message || "Failed to change password");
        }
      } catch (error) {
        console.error("Change password error:", error);
        showError("An error occurred while changing password");
      }
    }
  };

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (changePasswordBtn)
    changePasswordBtn.addEventListener("click", handleChangePassword);
});
