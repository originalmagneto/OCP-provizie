const config = {
  API_BASE_URL: "https://ocp-provizie.netlify.app", // Update this with your actual API URL
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const loginContainer = document.getElementById("loginContainer");
  const changePasswordContainer = document.getElementById("changePasswordContainer");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      console.log(`Login attempt for user: ${username}`);

      try {
        const response = await fetch(`${config.API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

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
          console.error(`Login failed for user: ${username}. Reason: ${data.message}`);
          alert(`Login failed: ${data.message}`);
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        const response = await fetch(`${config.API_BASE_URL}/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, newPassword }),
        });

        const data = await response.json();

        if (data.success) {
          alert("Password changed successfully. Please log in with your new password.");
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
    });
  }
});
  API_BASE_URL: "https://ocp-provizie.netlify.app", // Update this with your actual API URL
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const loginContainer = document.getElementById("loginContainer");
  const changePasswordContainer = document.getElementById("changePasswordContainer");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      console.log(`Login attempt for user: ${username}`);

      try {
        const response = await fetch(`${config.API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

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
          console.error(`Login failed for user: ${username}. Reason: ${data.message}`);
          alert(`Login failed: ${data.message}`);
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        const response = await fetch(`${config.API_BASE_URL}/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, newPassword }),
        });

        const data = await response.json();

        if (data.success) {
          alert("Password changed successfully. Please log in with your new password.");
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
    });
  }
});
  API_BASE_URL: "https://ocp-provizie.netlify.app", // Update this with your actual API URL
};

// Add the config object if it doesn't exist
if (typeof config === "undefined") {
  const config = {
    API_BASE_URL: "https://ocp-provizie.netlify.app", // Update this with your actual API URL
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(`${config.API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

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
          alert(`Login failed: ${data.message}`);
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
      }
    });
  }
  const loginForm = document.getElementById("loginForm");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const loginContainer = document.getElementById("loginContainer");
  const changePasswordContainer = document.getElementById(
    "changePasswordContainer",
  );

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch(`${config.API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

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
        console.log(`Login failed for user: ${username}`);
        alert(data.message || "Invalid username or password");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
  const loginForm = document.getElementById("loginForm");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const loginContainer = document.getElementById("loginContainer");
  const changePasswordContainer = document.getElementById(
    "changePasswordContainer",
  );

  // Mock user data (replace this with actual authentication in production)
  const users = {
    AdvokatiCHZ: {
      password: "password123",
      requirePasswordChange: false,
    },
    MKMs: {
      password: "password123",
      requirePasswordChange: false,
    },
    Contax: {
      password: "password123",
      requirePasswordChange: false,
    },
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log(`Login attempt for user: ${username}`);

    if (!users[username]) {
      console.log(`User not found: ${username}`);
      alert("Invalid username or password");
      return;
    }

    if (password === users[username].password) {
      console.log(`Login successful for user: ${username}`);
      if (users[username].requirePasswordChange) {
        loginContainer.style.display = "none";
        changePasswordContainer.style.display = "block";
      } else {
        localStorage.setItem("currentUser", username);
        window.location.href = "index.html";
      }
    } else {
      console.log(`Invalid password for user: ${username}`);
      alert("Invalid username or password");
    }
  });

  changePasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // In a real application, you would send this to a server to update the password
    users[username].password = newPassword;
    users[username].requirePasswordChange = false;

    alert(
      "Password changed successfully. Please log in with your new password.",
    );
    loginContainer.style.display = "block";
    changePasswordContainer.style.display = "none";
    document.getElementById("password").value = "";
  });
});
