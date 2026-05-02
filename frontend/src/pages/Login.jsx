import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';
import { Webhook, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('username', response.data.username);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="animated-shape shape-1"></div>
        <div className="animated-shape shape-2"></div>
        <div className="animated-shape shape-3"></div>
        
        <div className="auth-hero fade-in">
          <div className="logo-container">
            <Webhook size={48} color="var(--primary-color)" />
            <h1>WebHookHub</h1>
          </div>
          <p className="hero-subtitle">The ultimate black box recorder for your APIs.</p>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <p>Monitor incoming payloads</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <p>Replay events instantly</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <p>Debug failures safely</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-card glass-panel fade-in">
          <h2>Welcome Back</h2>
          <p className="auth-description">Enter your credentials to access your dashboard.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="developer123"
                required 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Logging in...' : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
