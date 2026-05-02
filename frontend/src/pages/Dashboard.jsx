import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/dashboard.css';
import '../styles/advanced.css';
import { Webhook, LogOut, RefreshCw, Server, Send, AlertCircle, CheckCircle2, Search, Filter } from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import JsonViewer from '../components/JsonViewer';
import AnalyticsView from '../components/AnalyticsView';
import { LayoutDashboard, BarChart2 } from 'lucide-react';

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
          },
          onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
          }
        });
        stompClient.activate();
      }
    };

    initialize();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
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

  const renderPayload = (payload) => {
    return <JsonViewer src={payload} raw={payload} />;
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
          <Webhook size={24} color="var(--primary-color)" />
          <h2>Hub</h2>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <LayoutDashboard size={18} /> Live Events
          </button>
          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={18} /> Analytics
          </button>
        </nav>

        <div className="sidebar-section">
          <h3>Your Endpoints</h3>
          <p className="hint">Send webhooks to your base URL or add a custom path at the end to organize them!</p>
          <div className="endpoint-box">
            <code>http://localhost:8080/webhook/{user?.id}/[path]</code>
            <button 
              className="copy-btn-mini" 
              onClick={() => {
                navigator.clipboard.writeText(`http://localhost:8080/webhook/${user?.id}/default`);
                alert('URL copied to clipboard!');
              }}
            >
              Copy
            </button>
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
          <h1>{activeTab === 'events' ? 'Events Log' : 'Analytics Dashboard'}</h1>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchEvents}>
              <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>
        </header>

        {activeTab === 'events' ? (
          <>
            {/* Filter Bar */}
            <div className="filter-bar glass-panel">
              <div className="search-input-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search payload or endpoint..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-selects">
                <div className="select-wrapper">
                  <Filter size={14} />
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div className="select-wrapper">
                  <Filter size={14} />
                  <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
                    <option value="ALL">All Methods</option>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="content-split">
              <div className="events-list glass-panel custom-scrollbar">
                {loading && events.length === 0 ? (
                  <div className="empty-state">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                  <div className="empty-state">
                    <Server size={48} opacity={0.5} />
                    <p>No webhooks found.</p>
                  </div>
                ) : (
                  filteredEvents.map(event => (
                    <div
                      key={event.id}
                      className={`event-card ${selectedEvent?.id === event.id ? 'active' : ''}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="event-card-header">
                        <span className={`badge-${event.method.toLowerCase()}`}>{event.method}</span>
                        <span className="time">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <div className="event-card-body">
                        <span className={`status-icon ${event.status.toLowerCase()}`}>
                          {event.status === 'SUCCESS' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        </span>
                        <span className="event-path">/{event.endpointPath || ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="event-detail glass-panel custom-scrollbar">
                {selectedEvent ? (
                  <div className="detail-content">
                    <div className="detail-header">
                      <div className="detail-title">
                        <span className={`method-badge large ${selectedEvent.method.toLowerCase()}`}>{selectedEvent.method}</span>
                        <h3>/{selectedEvent.endpointPath}</h3>
                      </div>
                      <div className="detail-actions">
                        <button className="replay-btn" onClick={() => handleReplay(selectedEvent.id)} disabled={replaying}>
                          <Send size={16} className={replaying ? 'sending' : ''} /> {replaying ? 'Replaying...' : 'Replay'}
                        </button>
                      </div>
                    </div>

                    {selectedEvent.errorMessage && (
                      <div className="error-banner">
                        <AlertCircle size={16} />
                        <span>{selectedEvent.errorMessage}</span>
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
                      <div className="json-viewer-wrapper code-block">
                        {renderPayload(selectedEvent.payload)}
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
          </>
        ) : (
          <AnalyticsView />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
