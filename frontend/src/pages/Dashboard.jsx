import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/dashboard.css';
import { Webhook, LogOut, RefreshCw, Server, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [forwardUrl, setForwardUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await api.get('/user/me');
      setUser(res.data);
      if (res.data.forwardUrl) setForwardUrl(res.data.forwardUrl);
    } catch (e) {
      if (e.response?.status === 401) handleLogout();
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEvent) {
        setSelectedEvent(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchEvents();
    // Simple polling for new events
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleSaveForwardUrl = async () => {
    setSavingUrl(true);
    try {
      await api.post('/user/forward-url', { forwardUrl });
      fetchUser();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUrl(false);
    }
  };

  const handleReplay = async (eventId) => {
    setReplaying(true);
    try {
      await api.post(`/events/${eventId}/replay`);
      await fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setReplaying(false);
    }
  };

  const renderPayload = (payload) => {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  };

  const renderHeaders = (headersStr) => {
    if (headersStr.startsWith('{') && headersStr.endsWith('}')) {
      const content = headersStr.slice(1, -1);
      const pairs = content.split(', ').map(p => p.split('='));
      return (
        <div className="headers-grid">
          {pairs.map(([k, v], idx) => (
            <div key={idx} className="header-row">
              <span className="header-key">{k}</span>
              <span className="header-value">{v}</span>
            </div>
          ))}
        </div>
      );
    }
    return <pre>{headersStr}</pre>;
  };

  return (
    <div className="dashboard-layout">
      <div className="bg-gradient top-right"></div>
      <div className="bg-gradient bottom-left"></div>

      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <Webhook size={32} color="var(--primary-color)" />
          <h2>Hub</h2>
        </div>

        <div className="sidebar-section">
          <h3>Your Endpoint</h3>
          <div className="endpoint-box">
            <code>http://localhost:8080/webhook/{user?.id}</code>
          </div>
        </div>

        <div className="sidebar-section forward-section">
          <h3>Forward To (Local/Remote)</h3>
          <p className="hint">Where should we resend the data?</p>
          <input
            type="text"
            placeholder="http://localhost:3000/api/webhook"
            value={forwardUrl}
            onChange={e => setForwardUrl(e.target.value)}
          />
          <button onClick={handleSaveForwardUrl} disabled={savingUrl}>
            {savingUrl ? 'Saving...' : 'Update Target'}
          </button>
        </div>

        <div className="spacer"></div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="main-header glass-panel">
          <h1>Events Log</h1>
          <button className="refresh-btn" onClick={fetchEvents}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </header>

        <div className="content-split">
          <div className="events-list glass-panel custom-scrollbar">
            {loading && events.length === 0 ? (
              <div className="empty-state">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <Server size={48} opacity={0.5} />
                <p>Waiting for incoming webhooks...</p>
                <small>Send a POST request to your endpoint to get started.</small>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`event-card ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="event-card-header">
                    <span className={`method badge-${event.method.toLowerCase()}`}>{event.method}</span>
                    <span className="time">{new Date(event.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="event-card-body">
                    <span className={`status-icon ${event.status === 'SUCCESS' ? 'success' : 'error'}`}>
                      {event.status === 'SUCCESS' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </span>
                    <span className="status-text">{event.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="event-detail glass-panel custom-scrollbar">
            {selectedEvent ? (
              <div className="detail-content fade-in">
                <div className="detail-header">
                  <div className="detail-title">
                    <span className={`method badge-${selectedEvent.method.toLowerCase()}`}>{selectedEvent.method}</span>
                    <h3>Event Details</h3>
                  </div>
                  <button
                    className="replay-btn"
                    onClick={() => handleReplay(selectedEvent.id)}
                    disabled={replaying}
                  >
                    <Send size={16} /> {replaying ? 'Replaying...' : 'Replay'}
                  </button>
                </div>

                {selectedEvent.errorMessage && (
                  <div className={`detail-error ${selectedEvent.status === 'SUCCESS' ? 'info' : ''}`}>
                    {selectedEvent.status === 'SUCCESS' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <div>
                      <strong>{selectedEvent.status === 'SUCCESS' ? 'Log Status' : 'Delivery Failed'}</strong>
                      <p>{selectedEvent.errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Headers</h4>
                  <div className="code-block">
                    {renderHeaders(selectedEvent.headers)}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Payload</h4>
                  <div className="code-block">
                    <pre>{renderPayload(selectedEvent.payload)}</pre>
                  </div>
                </div>

                <div className="detail-meta">
                  <span>Received at: {new Date(selectedEvent.createdAt).toLocaleString()}</span>
                  <span>ID: {selectedEvent.id}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Select an event to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
