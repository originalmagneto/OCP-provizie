const config = {
  API_BASE_URL: "https://ocp-provizie.netlify.app", // Update this with your actual API URL
};

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const loginContainer = document.getElementById("loginContainer");
  const changePasswordContainer = document.getElementById(
    "changePasswordContainer",
  );

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", handlePasswordChange);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log(`Login attempt for user: ${username}`);

    try {
      const response = await fetch(
        `${config.API_BASE_URL}/.netlify/functions/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        console.log(`Login successful for user: ${username}`);
        if (data.requirePasswordChange) {
          loginContainer.style.display = "none";
          changePasswordContainer.style.display = "block";
        } else {
          localStorage.setItem("currentUser", username);
          window.location.href = "index.html";
        }
      } else {
        console.error(
          `Login failed for user: ${username}. Reason: ${data.message}`,
        );
        alert(`Login failed: ${data.message || "Unknown error occurred"}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert(
        `An error occurred during login: ${error.message}. Please try again.`,
      );
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `${config.API_BASE_URL}/.netlify/functions/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, newPassword }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(
          "Password changed successfully. Please log in with your new password.",
        );
        loginContainer.style.display = "block";
        changePasswordContainer.style.display = "none";
        document.getElementById("password").value = "";
      } else {
        alert(`Failed to change password: ${data.message}`);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("An error occurred while changing the password. Please try again.");
    }
  }
});
