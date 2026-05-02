import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';
import { Webhook, ArrowRight } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/register', { username, password });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data || 'Registration failed. Username might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container reverse">
      <div className="auth-left">
        <div className="animated-shape shape-1"></div>
        <div className="animated-shape shape-2"></div>
        
        <div className="auth-hero fade-in">
          <div className="logo-container">
            <Webhook size={48} color="var(--primary-color)" />
            <h1>WebHookHub</h1>
          </div>
          <p className="hero-subtitle">Start catching your webhooks in seconds.</p>
          <div className="onboarding-steps">
            <div className="step">
              <div className="step-number">1</div>
              <p>Create your account</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <p>Get your unique endpoint</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <p>Start receiving payloads</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-card glass-panel fade-in">
          <h2>Create Account</h2>
          <p className="auth-description">Join WebHookHub to simplify your API testing.</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleRegister} className="auth-form">
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
                placeholder="Choose a strong password"
                required 
                minLength={6}
              />
            </div>
            
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Registering...' : (
                <>Sign Up <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
