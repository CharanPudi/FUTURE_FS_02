// app.js — Handles the registration form on index.html

const API = 'http://localhost:5000/api'; // Change this to your backend URL

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent the page from refreshing

  const name     = document.getElementById('name').value;
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const errorEl   = document.getElementById('error-msg');
  const successEl = document.getElementById('success-msg');
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  try {
    // Send a POST request to our backend register endpoint
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      // Show the error message from the server
      errorEl.textContent = data.message;
      errorEl.classList.remove('hidden');
      return;
    }

    // On success, save the token and redirect to dashboard
    localStorage.setItem('crm_token', data.token);
    localStorage.setItem('crm_user', JSON.stringify({ name: data.name, email: data.email }));
    window.location.href = 'dashboard.html';

  } catch (err) {
    errorEl.textContent = 'Server error. Make sure the backend is running.';
    errorEl.classList.remove('hidden');
  }
});
