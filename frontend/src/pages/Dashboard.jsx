import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Webhook, LogOut, RefreshCw, Server, Send, 
  AlertCircle, CheckCircle2, Search, Filter,
  LayoutDashboard, BarChart2, Copy, Terminal
} from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import JsonViewer from '../components/JsonViewer';
import AnalyticsView from '../components/AnalyticsView';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [forwardUrl, setForwardUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [replaying, setReplaying] = useState(false);

  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // UI State
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'analytics'

  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await api.get('/user/me');
      setUser(res.data);
      if (res.data.forwardUrl) setForwardUrl(res.data.forwardUrl);
      return res.data;
    } catch (e) {
      if (e.response?.status === 401) handleLogout();
      return null;
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
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
    let stompClient = null;

    const initialize = async () => {
      const currentUser = await fetchUser();
      await fetchEvents();

      if (currentUser?.id) {
        const socket = new SockJS('http://localhost:8080/ws');
        stompClient = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          connectHeaders: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onConnect: () => {
            console.log('Connected to WebSocket!');
            stompClient.subscribe(`/topic/events/${currentUser.id}`, (message) => {
              if (message.body) {
                const newEvent = JSON.parse(message.body);
                setEvents(prev => [newEvent, ...prev]);
              }
            });
          }
        });
        stompClient.activate();
      }
    };

    initialize();

    return () => {
      if (stompClient) stompClient.deactivate();
    };
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

  const renderHeaders = (headersStr) => {
    if (!headersStr) return null;
    try {
      if (headersStr.startsWith('{') && headersStr.endsWith('}')) {
        const content = headersStr.slice(1, -1);
        const pairs = content.split(', ').map(p => {
          const idx = p.indexOf('=');
          return [p.slice(0, idx), p.slice(idx + 1)];
        });
        return (
          <div className="header-grid">
            {pairs.map(([k, v], idx) => (
              <React.Fragment key={idx}>
                <div className="header-key">{k}</div>
                <div className="header-val">{v}</div>
              </React.Fragment>
            ))}
          </div>
        );
      }
    } catch (e) {}
    return <pre className="font-mono" style={{ fontSize: '0.7rem' }}>{headersStr}</pre>;
  };

  // Filter Logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' ||
      event.payload?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.endpointPath?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || event.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="dashboard-layout">
      <div className="bg-gradient top-right"></div>
      <div className="bg-gradient bottom-left"></div>

      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <Webhook size={24} color="var(--rust)" />
          <h2>WebHook<span>Hub</span></h2>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <LayoutDashboard size={16} /> Live Events
          </button>
          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={16} /> Analytics
          </button>
        </nav>

        <div className="sidebar-section">
          <h3>Endpoint</h3>
          <p className="hint">Receive payloads at this unique URL.</p>
          <div className="endpoint-box">
            <code>http://localhost:8080/webhook/{user?.id}/[path]</code>
            <button 
              className="copy-btn-mini" 
              onClick={() => {
                navigator.clipboard.writeText(`http://localhost:8080/webhook/${user?.id}/default`);
              }}
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        </div>

        <div className="sidebar-section forward-section">
          <h3>Forwarding</h3>
          <p className="hint">Auto-resend to local or remote server.</p>
          <input
            type="text"
            placeholder="http://localhost:3000/api/webhook"
            value={forwardUrl}
            onChange={e => setForwardUrl(e.target.value)}
          />
          <button onClick={handleSaveForwardUrl} disabled={savingUrl}>
            {savingUrl ? 'Updating...' : 'Update Target'}
          </button>
        </div>

        <div className="spacer"></div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="main-header glass-panel">
          <h1>{activeTab === 'events' ? 'Events Log' : 'Analytics Dashboard'}</h1>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchEvents} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {activeTab === 'events' ? (
          <div className="events-container">
            {/* List Panel */}
            <div className="events-list-panel">
              <div className="filter-bar glass-panel">
                <div className="search-input-wrapper">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Filter payloads..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="ALL">Status</option>
                    <option value="SUCCESS">OK</option>
                    <option value="FAILED">ERR</option>
                  </select>
                  <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
                    <option value="ALL">Method</option>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
              </div>

              <div className="events-scroll custom-scrollbar">
                <AnimatePresence initial={false}>
                  {filteredEvents.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`event-card glass-panel ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="event-meta">
                        <span className={`method-badge ${event.method}`}>{event.method}</span>
                        <span className="event-time">
                          {new Date(event.createdAt).toLocaleTimeString([], { hour12: false })}
                        </span>
                      </div>
                      <div className="event-path">/{event.endpointPath || 'default'}</div>
                      <div className={`status-badge ${event.status.toLowerCase()}`}>
                        {event.status === 'SUCCESS' ? '200 OK' : '500 ERROR'}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredEvents.length === 0 && !loading && (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)' }}>
                    <Server size={28} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.75rem' }}>No events recorded.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="detail-panel glass-panel">
              {selectedEvent ? (
                <>
                  <div className="detail-header">
                    <div className="detail-title">
                      <h2>/{selectedEvent.endpointPath || 'default'}</h2>
                      <div className="detail-id">UUID: {selectedEvent.id}</div>
                    </div>
                    <button className="replay-btn" onClick={() => handleReplay(selectedEvent.id)} disabled={replaying}>
                      <Send size={14} className={replaying ? 'spinning' : ''} />
                      {replaying ? 'Replaying...' : 'Replay Event'}
                    </button>
                  </div>

                  <div className="detail-scroll custom-scrollbar">
                    {selectedEvent.errorMessage && (
                      <div className="detail-section" style={{ background: 'rgba(231, 76, 60, 0.05)', padding: '1rem', borderRadius: '4px', border: '1px solid rgba(231, 76, 60, 0.2)', color: '#E74C3C', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Processing Error</div>
                        {selectedEvent.errorMessage}
                      </div>
                    )}

                    <div className="detail-section">
                      <h3><Terminal size={14} /> Headers</h3>
                      {renderHeaders(selectedEvent.headers)}
                    </div>

                    <div className="detail-section">
                      <h3><Webhook size={14} /> Payload</h3>
                      <div className="font-mono">
                        <JsonViewer src={selectedEvent.payload} raw={selectedEvent.payload} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  Select an event to view full inspection data.
                </div>
              )}
            </div>
          </div>
        ) : (
          <AnalyticsView />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
