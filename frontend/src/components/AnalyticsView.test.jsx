import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsView from './AnalyticsView';
import api from '../api';
import React from 'react';

// Mock the API and Recharts (Recharts is hard to test in JSDOM)
vi.mock('../api');
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: () => <div data-testid="area-chart" />,
  BarChart: () => <div data-testid="bar-chart" />,
  PieChart: () => <div data-testid="pie-chart" />,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}));

describe('AnalyticsView', () => {
  const mockData = {
    totalEvents: 100,
    successCount: 80,
    failureCount: 20,
    statusDistribution: [{ status: 'SUCCESS', count: 80 }, { status: 'FAILED', count: 20 }],
    endpointDistribution: [{ path: 'default', count: 100 }],
    timeSeriesData: [{ time: '2026-05-06T12:00:00', count: 10 }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AnalyticsView />);
    expect(screen.getByText(/Loading analytics/i)).toBeDefined();
  });

  it('renders error message when no data is available', async () => {
    api.get.mockResolvedValue({ data: {} });
    render(<AnalyticsView />);
    await waitFor(() => {
      expect(screen.getByText(/No webhook data available yet/i)).toBeDefined();
    });
  });

  it('renders statistics correctly when data is loaded', async () => {
    api.get.mockResolvedValue({ data: mockData });
    render(<AnalyticsView />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeDefined(); // totalEvents
      expect(screen.getByText('80')).toBeDefined();  // successCount
      expect(screen.getByText('20')).toBeDefined();  // failureCount
      expect(screen.getByText('80%')).toBeDefined(); // health (80/100)
    });
  });

  it('renders charts container', async () => {
    api.get.mockResolvedValue({ data: mockData });
    render(<AnalyticsView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeDefined();
      expect(screen.getByTestId('bar-chart')).toBeDefined();
      expect(screen.getByTestId('pie-chart')).toBeDefined();
    });
  });
});
