import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    
    if (authError) {
      setError(authError.message);
    } else {
      onClose(); // the AppContext auto-updates auth state
    }
  };

  return (
    <div className="overlay open" onClick={onClose} style={{ zIndex: 700 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>Admin Login</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 15 }}>{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Authenticating..." : "Login →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
