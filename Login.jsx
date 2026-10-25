import { useState } from 'react';

export default function Login({ onLogin, toggleAuth, apiBaseUrl = 'http://localhost:3000' }) {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!loginInput || !password) {
      alert("Please enter both email/name and password");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include', // 🎯 CRITICAL: Keeps you logged in when you refresh the browser!
        body: JSON.stringify({ 
          loginInput: loginInput.trim(), 
          password: password 
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Login successful!");
        onLogin(data.user); 
      } else {
        alert(data.message || "Invalid credentials configuration.");
      }
    } catch (error) {
      console.error("Login component network crash:", error);
      alert("Cannot connect to backend server. Ensure node server.js is active.");
    }
  };

  return (
    <div className="auth-card" style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '400px', margin: '50px auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>Sign In</h2>
      <p className="auth-subtitle">Welcome back to Smart Grocery AI</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
        <input
          type="text"
          placeholder="Email Address or Username"
          value={loginInput}
          onChange={(e) => setLoginInput(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button onClick={handleLoginSubmit} className="btn-auth-primary" style={{ width: '100%', padding: '10px', background: '#00796b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Sign In
      </button>

      <button onClick={() => toggleAuth('signup')} className="btn-auth-secondary" style={{ width: '100%', padding: '10px', marginTop: '8px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Create an Account
      </button>
    </div>
  );
}