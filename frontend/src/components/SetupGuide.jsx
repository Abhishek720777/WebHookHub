import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Cpu, Globe, Zap, Search } from 'lucide-react';

const SetupGuide = ({ userId, projectSlug }) => {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [workflow, setWorkflow] = useState('inspector'); // 'inspector' or 'developer'
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const webhookUrl = `${baseUrl}/webhook/${userId}/${projectSlug || 'default'}/default`;
  const cliInstallCommand = `npm install -g webhookhub-tool-abhi777\nwebhookhub login`;
  const cliCommand = `webhookhub -p ${projectSlug || 'default'} -t http://localhost:3000/api/webhook`;

  const handleCopy = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="setup-guide fade-in">
      <div className="guide-header">
        <div className="guide-icon"><Zap size={24} /></div>
        <h2>Capture <span>&</span> Debug</h2>
        <p>Choose how you want to handle incoming webhooks for this project.</p>
      </div>

      <div className="guide-tabs">
        <button 
          className={`guide-tab ${workflow === 'inspector' ? 'active' : ''}`}
          onClick={() => setWorkflow('inspector')}
        >
          <Search size={16} /> Cloud Inspector
        </button>
        <button 
          className={`guide-tab ${workflow === 'developer' ? 'active' : ''}`}
          onClick={() => setWorkflow('developer')}
        >
          <Terminal size={16} /> Local Developer
        </button>
      </div>

      <div className="guide-steps">
        {workflow === 'inspector' ? (
          <>
            <div className="guide-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Configure Your Webhook Provider</h3>
                <p>Paste this Payload URL into Stripe, GitHub, Shopify, etc.</p>
                <div className="command-box url-box">
                  <code>{webhookUrl}</code>
                  <button onClick={() => handleCopy(webhookUrl, setCopiedUrl)} className="copy-command-btn">
                    {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Trigger an Event</h3>
                <p>Perform an action in your provider (e.g., make a test payment or push code) to fire a webhook.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Inspect Live</h3>
                <p>Watch events land on your dashboard in real-time with full headers, payloads, and validation status.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="guide-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Install the CLI Tool</h3>
                <p>Install our global npm package and login to link your account.</p>
                <div className="command-box">
                  <code style={{ whiteSpace: 'pre-wrap' }}>{cliInstallCommand}</code>
                </div>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Start the Tunnel</h3>
                <p>Forward cloud events directly to your local backend server.</p>
                <div className="command-box">
                  <code>{cliCommand}</code>
                  <button onClick={() => handleCopy(cliCommand, setCopied)} className="copy-command-btn">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Develop Locally</h3>
                <p>Use the Replay button on the dashboard to continuously test your local handlers without triggering new cloud events.</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="guide-footer glass-panel">
        <div className="footer-item">
          <Globe size={14} />
          <span>Public URL Active</span>
        </div>
        <div className="footer-item">
          <Cpu size={14} />
          <span>{workflow === 'inspector' ? 'Ready to Capture' : 'Local Bridge Ready'}</span>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
