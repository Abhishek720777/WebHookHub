import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Cpu, Globe, Zap } from 'lucide-react';

const SetupGuide = ({ userId, projectSlug }) => {
  const [copied, setCopied] = useState(false);
  const cliCommand = `webhookhub -p ${projectSlug || 'default'} -t http://localhost:3000/api/webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  return (
    <div className="setup-guide fade-in">
      <div className="guide-header">
        <div className="guide-icon"><Zap size={24} /></div>
        <h2>Connect Your <span>Local Machine</span></h2>
        <p>Tunnel webhooks from our public URL directly to your local development environment.</p>
      </div>

      <div className="guide-steps">
        <div className="guide-step">
          <div className="step-number">01</div>
          <div className="step-content">
            <h3>Configure Your Webhook Provider</h3>
            <p>Set your Payload URL in Stripe, GitHub, or Shopify to:</p>
            <div className="url-box command-box">
              <code>{`${baseUrl}/webhook/${userId}/${projectSlug || 'default'}/default`}</code>
            </div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">02</div>
          <div className="step-content">
            <h3>Start the Tunnel</h3>
            <p>Run this command in your terminal to begin receiving events locally.</p>
            <div className="command-box">
              <code>{cliCommand}</code>
              <button onClick={handleCopy} className="copy-command-btn">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">03</div>
          <div className="step-content">
            <h3>Ship with Confidence</h3>
            <p>Develop and test your webhook handlers without ever leaving your IDE.</p>
          </div>
        </div>
      </div>

      <div className="guide-footer glass-panel">
        <div className="footer-item">
          <Globe size={14} />
          <span>Public URL Active</span>
        </div>
        <div className="footer-item">
          <Cpu size={14} />
          <span>Local Bridge Ready</span>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
