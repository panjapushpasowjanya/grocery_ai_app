import { useState } from 'react';

export default function Signup({ toggleAuth, apiBaseUrl = 'http://localhost:3000' }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    familySize: 4,
  });

  const handleSignupSubmit = async (e) => {
    if (e) e.preventDefault();

    // 1. Basic Field Validation
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      alert("Please fill out all required fields");
      return;
    }

    // 2. Email Formatting Validation Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      alert("Please enter a valid email address structure (e.g., user@gmail.com)");
      return;
    }

    // 3. Strong Password Rules (Minimum 6 Characters)
    if (form.password.length < 6) {
      alert("Security Requirement: Password must be at least 6 characters long.");
      return;
    }

    // 4. Password Matching Verification
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include', // 🎯 Aligns handshake tracking configurations
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(), // Keeps records lowercase in MySQL
          password: form.password,
          familySize: Number(form.familySize)
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Account registration successful! You can now log in.");
        toggleAuth('login'); 
      } else {
        alert(data.message || "Registration encountered an issue.");
      }
    } catch (error) {
      console.error("Signup component network crash:", error);
      alert("Cannot connect to backend server. Ensure node server.js is active.");
    }
  };

  return (
    <div className="auth-card" style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '400px', margin: '50px auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>Create Account</h2>
      <p className="auth-subtitle">Start your smart grocery journey</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password (Min. 6 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />

        <input
          type="number"
          placeholder="Family Size"
          value={form.familySize}
          min="1"
          onChange={(e) => setForm({ ...form, familySize: e.target.value })}
        />
      </div>

      <button onClick={handleSignupSubmit} className="btn-auth-primary" style={{ width: '100%', padding: '10px', background: '#00796b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Register
      </button>

      <button onClick={() => toggleAuth('login')} className="btn-auth-secondary" style={{ width: '100%', padding: '10px', marginTop: '8px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Back to Sign In
      </button>
    </div>
  );
}