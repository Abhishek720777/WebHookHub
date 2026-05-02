import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Activity, CheckCircle, XCircle, BarChart3, Clock, RefreshCw } from 'lucide-react';
import '../styles/analytics.css';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!data || !data.statusDistribution) return (
    <div className="error-container">
      <p>Failed to load analytics data. Make sure you have received some webhooks first!</p>
      <button onClick={fetchAnalytics} className="refresh-btn-analytics">Try Again</button>
    </div>
  );

  const statusData = (data.statusDistribution || []).map(item => ({
    name: item.status,
    value: Number(item.count)
  }));

  const endpointData = (data.endpointDistribution || []).map(item => ({
    name: item.path || 'default',
    count: Number(item.count)
  }));

  const timeData = (data.timeSeriesData || []).map(item => ({
    time: item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '?',
    count: Number(item.count)
  }));

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Analytics Overview</h2>
        <button className="refresh-btn-analytics" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><Activity size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Events</span>
            <span className="stat-value">{data.totalEvents}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Successful</span>
            <span className="stat-value">{data.successCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failure"><XCircle size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Failed</span>
            <span className="stat-value">{data.failureCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active"><Clock size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Success Rate</span>
            <span className="stat-value">
              {data.totalEvents > 0 ? Math.round((data.successCount / data.totalEvents) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card large">
          <h3><Activity size={18} /> Throughput Over Time</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3><BarChart3 size={18} /> Top Endpoints</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={endpointData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={80} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3><Activity size={18} /> Status Ratio</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'SUCCESS' ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
