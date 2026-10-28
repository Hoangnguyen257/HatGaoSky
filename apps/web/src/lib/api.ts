const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vietsky_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vietsky_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vietsky_token');
    localStorage.removeItem('vietsky_user');
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('vietsky_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vietsky_user', JSON.stringify(user));
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join('; ')
      : data.message || data.error || 'Yêu cầu không thành công';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyEmail: (body: any) => request<any>('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  verifyMfa: (body: any) => request<any>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),
  forgotPassword: (body: any) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // Flights
  getAirports: () => request<any[]>('/flights/airports'),
  searchFlights: (params: Record<string, any>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return request<any>(`/flights/search?${q.toString()}`);
  },
  getFlightDetail: (id: string) => request<any>(`/flights/${id}`),
  compareFlights: (flightIds: string[]) =>
    request<any>('/flights/compare', { method: 'POST', body: JSON.stringify({ flightIds }) }),
  getAllFlights: () => request<any[]>('/flights/all'),
  createFlight: (body: any) => request<any>('/flights', { method: 'POST', body: JSON.stringify(body) }),
  updateFlight: (id: string, body: any) => request<any>(`/flights/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  disableFlight: (id: string, reason: string) =>
    request<any>(`/flights/${id}/disable`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  removeFlight: (id: string) => request<any>(`/flights/${id}`, { method: 'DELETE' }),

  // Seats
  getFlightSeats: (flightId: string) => request<any>(`/seats/flight/${flightId}`),
  holdSeats: (body: any) => request<any>('/seats/hold', { method: 'POST', body: JSON.stringify(body) }),
  releaseSeats: (body: any) => request<any>('/seats/release', { method: 'POST', body: JSON.stringify(body) }),

  // Bookings
  createBooking: (body: any) => request<any>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  lookupBooking: (body: any) => request<any>('/bookings/lookup', { method: 'POST', body: JSON.stringify(body) }),
  getMyBookings: () => request<any[]>('/bookings/my'),
  cancelBooking: (pnr: string, body: any) =>
    request<any>(`/bookings/${pnr}/cancel`, { method: 'POST', body: JSON.stringify(body) }),
  upgradeCabin: (pnr: string, body: any) =>
    request<any>(`/bookings/${pnr}/upgrade`, { method: 'POST', body: JSON.stringify(body) }),
  addBaggage: (pnr: string, body: any) =>
    request<any>(`/bookings/${pnr}/add-baggage`, { method: 'POST', body: JSON.stringify(body) }),
  getBookingRequests: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/bookings/requests${q ? `?${q}` : ''}`);
  },
  updateBookingStatus: (id: string, status: string, reason: string) =>
    request<any>(`/bookings/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  // Payments
  checkout: (body: any) => request<any>('/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),

  // Loyalty
  getMyLoyalty: () => request<any>('/loyalty/my'),
  getRewards: () => request<any[]>('/loyalty/rewards'),
  exchangeReward: (id: string) => request<any>(`/loyalty/rewards/${id}/exchange`, { method: 'POST' }),
  buyMiles: (body: any) => request<any>('/loyalty/buy-miles', { method: 'POST', body: JSON.stringify(body) }),

  // Discounts
  validateDiscount: (body: any) => request<any>('/discounts/validate', { method: 'POST', body: JSON.stringify(body) }),
  getAllDiscounts: () => request<any[]>('/discounts'),
  createDiscount: (body: any) => request<any>('/discounts', { method: 'POST', body: JSON.stringify(body) }),
  updateDiscount: (id: string, body: any) => request<any>(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  removeDiscount: (id: string) => request<any>(`/discounts/${id}`, { method: 'DELETE' }),

  // Reports
  getDashboard: (period?: string) => request<any>(`/reports/dashboard?period=${period || 'MONTH'}`),
  calculateRevenue: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any>(`/reports/revenue${q ? `?${q}` : ''}`);
  },
  getStaffDetails: () => request<any[]>('/reports/staff'),
  createExportJob: (body: any) => request<any>('/reports/export', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getUsers: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/admin/users${q ? `?${q}` : ''}`);
  },
  getUserDetail: (id: string) => request<any>(`/admin/users/${id}`),
  updateUser: (id: string, body: any) => request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleUserStatus: (id: string, status: string) =>
    request<any>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteUser: (id: string) => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdmins: () => request<any[]>('/admin/admins'),
  createAdmin: (body: any) => request<any>('/admin/admins', { method: 'POST', body: JSON.stringify(body) }),
  removeAdmin: (id: string) => request<any>(`/admin/admins/${id}`, { method: 'DELETE' }),
  getAuditLogs: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/admin/logs${q ? `?${q}` : ''}`);
  },
  getSentEmails: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/admin/emails${q ? `?${q}` : ''}`);
  },
  getSettings: () => request<any[]>('/admin/settings'),
  updateSetting: (body: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
  anonymizeMe: () => request<any>('/admin/users/me/gdpr', { method: 'DELETE' }),
};
