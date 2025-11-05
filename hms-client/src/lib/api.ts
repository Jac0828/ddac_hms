/**
 * API client for HMS backend
 * Uses VITE_API_BASE_URL from environment variables
 */

// Get API base URL from env var, with fallback to localhost for development
// Handle empty string (from .env.production placeholder) by checking truthiness
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5272';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Simple fetch wrapper for API calls
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('jwtToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest<{ status: string; timestamp: string }>('/healthz');
}

/**
 * Get API base URL (for debugging)
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export default {
  checkHealth,
  getApiBaseUrl,
};

