import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Webhook, LogOut, RefreshCw, Server, Send, 
  AlertCircle, CheckCircle2, Search, Filter,
  LayoutDashboard, BarChart2, Copy, Terminal, Trash2,
  FolderPlus, Plus, Hash, X, Shield
} from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import JsonViewer from '../components/JsonViewer';
import AnalyticsView from '../components/AnalyticsView';
import SetupGuide from '../components/SetupGuide';

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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Channels State
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('ALL');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelSecret, setNewChannelSecret] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

  const fetchChannels = async () => {
    try {
      const res = await api.get('/channels');
      setChannels(res.data);
      return res.data;
    } catch (e) {
      console.error('Failed to fetch channels:', e);
      return [];
    }
  };

  const fetchEvents = async (pageToFetch = 0, isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    try {
      const response = await api.get(`/events?page=${pageToFetch}&size=20`);
      const newData = response.data.content || [];
      setEvents(prev => isLoadMore ? [...prev, ...newData] : newData);
      setHasMore(!response.data.last);
      setPage(pageToFetch);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let stompClient = null;

    const initialize = async () => {
      const currentUser = await fetchUser();
      await fetchChannels();
      await fetchEvents();

      if (currentUser?.id) {
        const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
        const socket = new SockJS(wsUrl, null, { withCredentials: true });
        stompClient = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          onConnect: () => {
            console.log('Connected to WebSocket!');
            stompClient.subscribe(`/topic/events/${currentUser.id}`, (message) => {
              if (message.body) {
                const newEvent = JSON.parse(message.body);
                setEvents(prev => {
                  if (prev.find(e => e.id === newEvent.id)) return prev;
                  return [newEvent, ...prev];
                });
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

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
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

  const handleDelete = async (eventId) => {
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const response = await api.post('/channels', { 
        name: newChannelName,
        signingSecret: newChannelSecret 
      });
      setChannels([...channels, response.data]);
      setNewChannelName('');
      setNewChannelSecret('');
      setIsAddingChannel(false);
      setSelectedChannelId(response.data.id);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleDeleteChannel = async (e, channelId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project? All associated event links will stop working.')) return;
    try {
      await api.delete(`/channels/${channelId}`);
      setChannels(prev => prev.filter(c => c.id !== channelId));
      if (selectedChannelId === channelId) setSelectedChannelId('ALL');
    } catch (e) {
      console.error('Failed to delete channel:', e);
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
    const matchesChannel = selectedChannelId === 'ALL' || event.channelId === selectedChannelId;

    return matchesSearch && matchesStatus && matchesMethod && matchesChannel;
  });

  const activeChannel = channels.find(c => c.id === selectedChannelId);

  return (
    <div className="dashboard-layout">
      <div className="bg-gradient top-right"></div>
      <div className="bg-gradient bottom-left"></div>

      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <Webhook size={24} color="var(--rust)" />
          <h2>WebHook<span>Hub</span></h2>
        </div>

        <div className="sidebar-scroll-area custom-scrollbar">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3>Projects</h3>
              <button 
                className="add-project-toggle" 
                onClick={() => setIsAddingChannel(!isAddingChannel)}
                title="New Project"
              >
                {isAddingChannel ? <X size={12} /> : <Plus size={12} />}
              </button>
            </div>
            
            {isAddingChannel && (
              <form className="add-channel-form" onSubmit={handleCreateChannel}>
                <input 
                  autoFocus
                  placeholder="Project name..." 
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                />
                <input 
                  placeholder="Signing secret (optional)" 
                  value={newChannelSecret}
                  onChange={e => setNewChannelSecret(e.target.value)}
                  type="password"
                  style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}
                />
                <button type="submit" className="add-channel-btn-mini" style={{ width: '100%', marginTop: '0.25rem' }}>Create Project</button>
              </form>
            )}

            <div className="channels-list">
              <div 
                className={`channel-item ${selectedChannelId === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedChannelId('ALL')}
              >
                <div className="channel-name"><Hash size={10} /> All Projects</div>
              </div>
              {channels.map(channel => (
                <div 
                  key={channel.id} 
                  className={`channel-item ${selectedChannelId === channel.id ? 'active' : ''}`}
                  onClick={() => setSelectedChannelId(channel.id)}
                >
                  <div className="channel-name">{channel.name}</div>
                  <button className="channel-delete-btn" onClick={(e) => handleDeleteChannel(e, channel.id)}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Endpoint</h3>
            <p className="hint">Receive payloads at this unique URL.</p>
            <div className="endpoint-box">
              {selectedChannelId === 'ALL' ? (
                <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Select a project to see URL</span>
              ) : (
                <>
                  <code>{`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/webhook/${user?.id}/${activeChannel?.slug}/[path]`}</code>
                  <button 
                    className="copy-btn-mini" 
                    onClick={() => {
                      const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/webhook/${user?.id}/${activeChannel?.slug}/default`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <Copy size={12} /> Copy
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="sidebar-section forward-section">
            <h3>Forwarding</h3>
            <p className="hint">Auto-resend to local or remote server.</p>
            <input
              type="text"
              placeholder="https://your-app.com/api/webhook"
              value={forwardUrl}
              onChange={e => setForwardUrl(e.target.value)}
            />
            <button onClick={handleSaveForwardUrl} disabled={savingUrl}>
              {savingUrl ? 'Updating...' : 'Update Target'}
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="main-header glass-panel">
          <h1>{activeTab === 'events' ? 'Events Log' : 'Analytics Dashboard'}</h1>
          <div className="header-actions">
            <button className="refresh-btn" onClick={() => fetchEvents(0)} disabled={loading}>
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
                      onClick={() => confirmDeleteId !== event.id && setSelectedEvent(event)}
                    >
                      {confirmDeleteId === event.id ? (
                        <div className="delete-confirm">
                          <span>Delete this event?</span>
                          <div className="delete-confirm-actions">
                            <button
                              className="delete-confirm-yes"
                              onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                            >
                              Delete
                            </button>
                            <button
                              className="delete-confirm-no"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="event-meta">
                            <span className={`method-badge ${event.method}`}>{event.method}</span>
                            <span className="event-time">
                              {new Date(event.createdAt).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <button
                              className="delete-event-btn"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(event.id); }}
                              title="Delete event"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="event-path">/{event.endpointPath || 'default'}</div>
                          <div className={`status-badge ${event.status.toLowerCase()}`}>
                            {event.status === 'SUCCESS' ? '200 OK' : '500 ERROR'}
                          </div>
                          {event.isVerified && (
                            <div className="verified-badge" title="Signature Verified">
                              <Shield size={10} />
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {hasMore && filteredEvents.length > 0 && (
                  <button className="load-more-btn" onClick={() => fetchEvents(page + 1, true)}>
                    Load More
                  </button>
                )}
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
                <SetupGuide userId={user?.id} projectSlug={activeChannel?.slug} />
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
