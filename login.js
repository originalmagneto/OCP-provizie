document.addEventListener("DOMContentLoaded", () => {
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
