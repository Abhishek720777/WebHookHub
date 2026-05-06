import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import api from '../api';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the API and useNavigate
vi.mock('../api');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Email or username/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
  });

  it('updates input values on change', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    const identifierInput = screen.getByPlaceholderText(/Email or username/i);
    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    expect(identifierInput.value).toBe('testuser');
  });

  it('shows error message on failed login', async () => {
    api.post.mockRejectedValue(new Error('Unauthorized'));
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Email or username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email\/username or password/i)).toBeDefined();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    api.post.mockResolvedValue({ data: { userId: 1, username: 'testuser' } });
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Email or username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(localStorage.getItem('userId')).toBe('1');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
