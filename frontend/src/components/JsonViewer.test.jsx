import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JsonViewer from '../components/JsonViewer';

describe('JsonViewer', () => {
  it('renders a valid JSON payload with syntax-highlighted output', () => {
    const payload = '{"event":"payment.captured","amount":50000}';
    render(<JsonViewer src={payload} raw={payload} />);

    const pre = document.querySelector('.json-pre');
    expect(pre).not.toBeNull();
    expect(pre.innerHTML).toContain('json-key');
    expect(pre.innerHTML).toContain('json-string');
  });

  it('renders raw text when payload is not valid JSON', () => {
    const raw = 'This is not JSON at all.';
    render(<JsonViewer src={raw} raw={raw} />);

    const pre = document.querySelector('.json-pre');
    expect(pre.textContent).toBe(raw);
  });

  it('shows a Copy button', () => {
    const payload = '{"key":"value"}';
    render(<JsonViewer src={payload} raw={payload} />);

    const btn = screen.getByText(/copy/i);
    expect(btn).not.toBeNull();
  });

  it('changes copy button text to "Copied!" when clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: () => Promise.resolve(),
      },
    });

    const payload = '{"key":"value"}';
    render(<JsonViewer src={payload} raw={payload} />);

    const btn = screen.getByText(/copy/i);
    fireEvent.click(btn);

    expect(screen.getByText(/Copied!/i)).not.toBeNull();
  });

  it('renders nested JSON objects without crashing', () => {
    const nested = JSON.stringify({
      event: 'payment.captured',
      payload: { amount: 5000, currency: 'INR', user: { id: 1 } },
    });

    expect(() => render(<JsonViewer src={nested} raw={nested} />)).not.toThrow();
  });
});
