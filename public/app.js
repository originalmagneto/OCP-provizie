document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.getElementById('mainContent');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                loginForm.style.display = 'none';
                mainContent.style.display = 'block';
                mainContent.innerHTML = `
                    <h2>Welcome, ${username}!</h2>
                    <p>You have successfully logged in.</p>
                    <button id="logoutBtn">Logout</button>
                `;

                document.getElementById('logoutBtn').addEventListener('click', () => {
                    fetch('/logout', { method: 'POST' })
                        .then(() => {
                            loginForm.style.display = 'block';
                            mainContent.style.display = 'none';
                        })
                        .catch(error => console.error('Logout error:', error));
                });
            } else {
                alert(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    });
});
