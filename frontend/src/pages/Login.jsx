import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';
import { Webhook, ArrowRight, Mail, Lock, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '' });
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/auth/login', { username: identifier, password });
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('username', response.data.username);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email/username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: resetData.email });
      setOtpSent(true);
      setSuccess('OTP sent to your email.');
    } catch (err) {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { 
        email: resetData.email, 
        otp: resetData.otp, 
        password: resetData.newPassword 
      });
      setSuccess('Password reset successful.');
      setShowForgot(false);
      setOtpSent(false);
    } catch (err) {
      const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : 'Reset failed.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-ornament" style={{ top: '10%', left: '5%', width: '120px', height: '120px' }}></div>
      <div className="floating-ornament" style={{ bottom: '15%', right: '10%', width: '180px', height: '180px', animationDelay: '-5s' }}></div>
      <div className="floating-ornament" style={{ top: '60%', left: '80%', width: '80px', height: '80px', animationDelay: '-10s' }}></div>
      
      <div className="auth-card-premium fade-in">
        <div className="auth-header-minimal">
          <div className="logo-icon">
            <Webhook size={28} />
          </div>
          <h1>{showForgot ? (otpSent ? 'Reset Password' : 'Forgot Access') : 'Sign In'}</h1>
          <p>{showForgot ? 'Follow the steps to regain access.' : 'Access your WebHookHub dashboard.'}</p>
        </div>

        {error && <div className="error-banner-minimal"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="success-message" style={{ marginBottom: '1.5rem' }}>{success}</div>}

        {!showForgot ? (
          <form onSubmit={handleLogin}>
            <div className="form-group-modern">
              <label>Identity</label>
              <div className="input-modern-wrapper">
                <Mail size={18} />
                <input 
                  type="text" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  placeholder="Email or username"
                  required 
                />
              </div>
            </div>
            <div className="form-group-modern">
              <label>Password</label>
              <div className="input-modern-wrapper">
                <Lock size={18} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>
              <button type="button" className="forgot-link-modern" onClick={() => setShowForgot(true)}>
                Forgot your password?
              </button>
            </div>
            <button type="submit" className="btn-premium" disabled={loading}>
              {loading ? 'Authenticating...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group-modern">
              <label>Email Address</label>
              <div className="input-modern-wrapper">
                <Mail size={18} />
                <input 
                  type="email" 
                  value={resetData.email} 
                  onChange={(e) => setResetData({ ...resetData, email: e.target.value })} 
                  placeholder="john@example.com"
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn-premium" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <div className="auth-footer-minimal">
              <button type="button" className="text-btn" onClick={() => setShowForgot(false)}>Back to Sign In</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group-modern">
              <label>Verification Code</label>
              <div className="input-modern-wrapper">
                <Key size={18} />
                <input 
                  type="text" 
                  value={resetData.otp} 
                  onChange={(e) => setResetData({ ...resetData, otp: e.target.value })} 
                  placeholder="6-digit code"
                  required 
                />
              </div>
            </div>
            <div className="form-group-modern">
              <label>New Password</label>
              <div className="input-modern-wrapper">
                <Lock size={18} />
                <input 
                  type="password" 
                  value={resetData.newPassword} 
                  onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn-premium" disabled={loading}>
              {loading ? 'Resetting...' : 'Update Password'}
            </button>
            <div className="auth-footer-minimal">
              <button type="button" className="text-btn" onClick={() => setOtpSent(false)}>Back</button>
            </div>
          </form>
        )}

        {!showForgot && (
          <div className="auth-footer-minimal">
            New to WebHookHub? <Link to="/register">Create an account</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
