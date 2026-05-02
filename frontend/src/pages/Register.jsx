import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';
import { Webhook, ArrowRight, User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('userId', res.data.userId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-ornament" style={{ top: '15%', right: '5%', width: '140px', height: '140px' }}></div>
      <div className="floating-ornament" style={{ bottom: '10%', left: '10%', width: '160px', height: '160px', animationDelay: '-3s' }}></div>
      <div className="floating-ornament" style={{ top: '70%', right: '20%', width: '90px', height: '90px', animationDelay: '-7s' }}></div>

      <div className="auth-card-premium fade-in">
        <div className="auth-header-minimal">
          <div className="logo-icon">
            <Webhook size={28} />
          </div>
          <h1>Create Account</h1>
          <p>Join WebHookHub to start monitoring APIs.</p>
        </div>

        {error && <div className="error-banner-minimal"><AlertCircle size={16} /> {error}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group-modern">
            <label>Username</label>
            <div className="input-modern-wrapper">
              <User size={18} />
              <input 
                name="username"
                type="text" 
                value={formData.username} 
                onChange={handleChange} 
                placeholder="developer_01"
                required 
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>Email Address</label>
            <div className="input-modern-wrapper">
              <Mail size={18} />
              <input 
                name="email"
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="dev@example.com"
                required 
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>Password</label>
            <div className="input-modern-wrapper">
              <Lock size={18} />
              <input 
                name="password"
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••"
                required 
              />
            </div>
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <div className="form-group-modern">
            <label>Confirm Password</label>
            <div className="input-modern-wrapper">
              <ShieldCheck size={18} />
              <input 
                name="confirmPassword"
                type="password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                placeholder="••••••••"
                required 
              />
            </div>
          </div>
          
          <button type="submit" className="btn-premium" disabled={loading}>
            {loading ? 'Creating Account...' : <>Join Now <ArrowRight size={18} /></>}
          </button>
        </form>
        
        <div className="auth-footer-minimal">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
