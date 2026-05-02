import React from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const getStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length > 7) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/\d/)) strength++;
    if (pass.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const colors = ['#E5E7EB', '#EF5350', '#FFB26B', '#F4845F', '#66BB6A'];

  return (
    <div className="strength-meter-modern">
      <div className="meter-dots">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="meter-dot" 
            style={{ 
              backgroundColor: i <= strength ? colors[strength] : colors[0],
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '6px', fontWeight: '500' }}>
        {strength === 0 ? 'Password should be secure' : 
         strength === 1 ? 'Very weak' : 
         strength === 2 ? 'Weak' : 
         strength === 3 ? 'Good' : 'Very strong'}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
