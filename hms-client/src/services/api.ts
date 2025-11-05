import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5272';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface Room {
  id: number;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  status: string;
  description: string;
  capacity: number;
  hasBalcony: boolean;
  hasWifi: boolean;
  hasTV: boolean;
  hasAirConditioning: boolean;
}

export interface Booking {
  id: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  specialRequests?: string;
  room?: Room;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<void> => {
    await api.post('/api/auth/register', data);
  },
};

export const roomsApi = {
  getAll: async (status?: string, roomType?: string): Promise<Room[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (roomType) params.append('roomType', roomType);
    const response = await api.get<Room[]>(`/api/rooms?${params.toString()}`);
    return response.data;
  },
  getById: async (id: number): Promise<Room> => {
    const response = await api.get<Room>(`/api/rooms/${id}`);
    return response.data;
  },
  getAvailable: async (checkIn: string, checkOut: string): Promise<Room[]> => {
    const response = await api.get<Room[]>(
      `/api/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`
    );
    return response.data;
  },
};

export const bookingsApi = {
  getAll: async (): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/api/bookings');
    return response.data;
  },
  getById: async (id: number): Promise<Booking> => {
    const response = await api.get<Booking>(`/api/bookings/${id}`);
    return response.data;
  },
  create: async (data: {
    roomId: number;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    specialRequests?: string;
  }): Promise<Booking> => {
    const response = await api.post<Booking>('/api/bookings', data);
    return response.data;
  },
  cancel: async (id: number): Promise<void> => {
    await api.delete(`/api/bookings/${id}`);
  },
};

export default api;

