// login.js — Handles the login form on login.html

const API = 'http://localhost:5000/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl  = document.getElementById('error-msg');
  const btn      = document.getElementById('login-btn');

  errorEl.classList.add('hidden');
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message;
      errorEl.classList.remove('hidden');
      btn.textContent = 'Sign In';
      btn.disabled = false;
      return;
    }

    // Save token and user info in localStorage for later use
    localStorage.setItem('crm_token', data.token);
    localStorage.setItem('crm_user', JSON.stringify({ name: data.name, email: data.email }));
    window.location.href = 'dashboard.html';

  } catch (err) {
    errorEl.textContent = 'Cannot reach server. Is the backend running?';
    errorEl.classList.remove('hidden');
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});
