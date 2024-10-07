async function loginNetlify(username, password) {
  try {
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('currentUser', username);
      window.location.href = 'index.html';
    } else {
      alert('Invalid username or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
  }
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  await loginNetlify(username, password);
});
