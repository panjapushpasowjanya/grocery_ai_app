import { useState } from "react";

export default function ForgotPassword({ toggleAuth, apiBaseUrl = 'http://localhost:3000' }) {
  const [email, setEmail] = useState("");

  const handlePasswordRecovery = async () => {
    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    try {
      // 🎯 Route fixed: Target matching your exact server.js POST route
      const response = await fetch(`${apiBaseUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        alert("Recovery link successfully emailed! Check your inbox.");
        toggleAuth("login");
      } else {
        alert(data.message || "Failed to process recovery mail.");
      }
    } catch (err) {
      console.error("Password reset failure details:", err);
      alert("Network server connection error.");
    }
  };

  return (
    <div className="auth-card" style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '400px', margin: '50px auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>Reset Password</h2>
      <p className="auth-subtitle">Enter your registered email below to receive a password reset link.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button onClick={handlePasswordRecovery} className="btn-auth-primary" style={{ width: '100%', padding: '10px', background: '#00796b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Send Recovery Email
      </button>

      <button onClick={() => toggleAuth('login')} className="btn-auth-secondary" style={{ width: '100%', padding: '10px', marginTop: '8px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Back to Login
      </button>
    </div>
  );
}