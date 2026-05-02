import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Activity, CheckCircle, XCircle, BarChart3, Clock, RefreshCw } from 'lucide-react';
import api from '../api';
import '../styles/analytics.css';

const COLORS = ['#5C7A60', '#C4562B', '#1A120B', '#E07A52', '#3D2E1A'];

// Helper to handle both camelCase and UPPERCASE keys from different DB drivers
const getVal = (obj, key) => obj[key.toLowerCase()] || obj[key.toUpperCase()] || 0;

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
      <RefreshCw size={24} className="spinning" /> &nbsp; Loading analytics...
    </div>
  );

  if (!data || !data.statusDistribution) return (
    <div className="error-container font-mono">
      <p>No webhook data available yet. Capture some events first!</p>
      <button onClick={fetchAnalytics} className="refresh-btn">Initialize Tracking</button>
    </div>
  );

  const statusData = (data.statusDistribution || []).map(item => {
    const status = (item.status || item.STATUS || '').toUpperCase();
    return {
      name: status === 'SUCCESS' ? 'Successful' : 'Failed',
      value: Number(item.count || item.COUNT || 0)
    };
  });

  const endpointData = (data.endpointDistribution || []).map(item => ({
    name: item.path || item.PATH || 'default',
    count: Number(item.count || item.COUNT || 0)
  }));

  const timeData = (data.timeSeriesData || []).map(item => ({
    time: (item.time || item.TIME) ? new Date(item.time || item.TIME).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : '?',
    count: Number(item.count || item.COUNT || 0)
  }));

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Intelligence <span>Metrics</span></h2>
        <button className="refresh-btn" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> {loading ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Total Volume</span>
            <span className="stat-value">{data.totalEvents}</span>
          </div>
          <Activity size={32} className="stat-icon" style={{ color: 'var(--ink)', opacity: 0.1 }} />
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Resolved</span>
            <span className="stat-value" style={{ color: 'var(--sage)' }}>{data.successCount}</span>
          </div>
          <CheckCircle size={32} className="stat-icon" style={{ color: 'var(--sage)', opacity: 0.1 }} />
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Intercepted Errors</span>
            <span className="stat-value" style={{ color: 'var(--rust)' }}>{data.failureCount}</span>
          </div>
          <XCircle size={32} className="stat-icon" style={{ color: 'var(--rust)', opacity: 0.1 }} />
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">System Health</span>
            <span className="stat-value">
              {data.totalEvents > 0 ? Math.round((data.successCount / data.totalEvents) * 100) : 100}%
            </span>
          </div>
          <Clock size={32} className="stat-icon" style={{ color: 'var(--ink)', opacity: 0.1 }} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card large glass-panel">
          <h3><Activity size={16} /> Data Flow Velocity</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--rust)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--rust)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" stroke="var(--muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'DM Mono', fontSize: '0.7rem' }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--rust)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-panel">
          <h3><BarChart3 size={16} /> Top Endpoints</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={endpointData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--muted)" fontSize={10} width={80} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'DM Mono', fontSize: '0.7rem' }}
                />
                <Bar dataKey="count" fill="var(--ink)" radius={[0, 2, 2, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-panel">
          <h3><Activity size={16} /> Resolution Ratio</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Successful' ? 'var(--sage)' : 'var(--rust)'} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'DM Mono', fontSize: '0.7rem' }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontFamily: 'DM Mono', fontSize: '0.7rem', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
