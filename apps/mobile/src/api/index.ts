import { request } from './client';

export const api = {
  // Auth
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),

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

  // Seats
  getFlightSeats: (flightId: string) => {
    return request<any>(`/seats/flight/${flightId}?_t=${Date.now()}`);
  },
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
  sendTicketEmail: (pnr: string, email?: string) =>
    request<any>(`/bookings/${pnr}/send-ticket-email`, { method: 'POST', body: JSON.stringify({ email }) }),

  // Payments
  checkout: (body: any) => request<any>('/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),

  // Loyalty
  getMyLoyalty: () => request<any>('/loyalty/my'),
  getRewards: () => request<any[]>('/loyalty/rewards'),
  exchangeReward: (id: string) => request<any>(`/loyalty/rewards/${id}/exchange`, { method: 'POST' }),

  // Staff / Manager
  getDashboard: (period?: string) => request<any>(`/reports/dashboard?period=${period || 'MONTH'}`),
  getAllFlights: () => request<any[]>('/flights/all'),
  getBookingRequests: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/bookings/requests${q ? `?${q}` : ''}`);
  },
  updateBookingStatus: (id: string, status: string, reason: string) =>
    request<any>(`/bookings/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
};
