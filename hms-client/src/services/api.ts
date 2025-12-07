import axios from 'axios';

// Use Vite environment variable (VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5024';

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
    // Log network errors for debugging
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        }
      });
    }
    
    // Don't redirect on 401 during login - let the login component handle it
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/login')) {
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
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface LoginResponse {
  token: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
  points?: number;
  membershipTier?: string;
  emailConfirmed?: boolean;
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
  // New fields for display
  imageUrls?: string[];
  amenities?: string[];
}

export interface Booking {
  id: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  totalAmount?: number; // Keep for backward compatibility
  status: string;
  specialRequests?: string;
  room?: {
    id: number;
    roomNumber: string;
    roomType: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ServiceRequest {
  id: number;
  bookingId: number;
  userId: string;
  serviceType: string;
  description: string;
  status: string;
  assignedToUserId?: string;
  requestedAt: string;
  completedAt?: string;
  notes?: string;
  booking?: Booking;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignedToUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<void> => {
    await api.post('/api/auth/register', data);
  },
  googleLogin: async (accessToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/google-login', { accessToken });
    return response.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.post('/api/auth/change-password', data);
  },
  updateProfile: async (data: { firstName: string; lastName: string; email: string; phoneNumber?: string }): Promise<{ message: string; token: string; user: any }> => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  sendVerificationEmail: async (): Promise<{ message: string; verificationCode?: string }> => {
    const response = await api.post('/api/auth/send-verification-email');
    return response.data;
  },
  verifyEmail: async (data: { userId: string; code: string }): Promise<{ message: string; token: string; emailConfirmed: boolean; membershipTier?: string }> => {
    const response = await api.post('/api/auth/verify-email', data);
    return response.data;
  },
};

export const roomsApi = {
  getAll: async (status?: string, roomType?: string): Promise<Room[]> => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (roomType) params.append('roomType', roomType);
      const queryString = params.toString();
      const url = queryString ? `/api/rooms?${queryString}` : '/api/rooms';
      const response = await api.get<Room[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('roomsApi.getAll error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      // Return empty array instead of throwing to prevent crash
      return [];
    }
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
  create: async (data: Partial<Room>): Promise<Room> => {
    const response = await api.post<Room>('/api/rooms', data);
    return response.data;
  },
  // New batch create method
  batchCreate: async (data: {
    roomTypeId: number;
    roomNumberRange: string;
    pricePerNight?: number;
  }): Promise<Room[]> => {
    const response = await api.post<Room[]>('/api/rooms/batch', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Room>): Promise<void> => {
    await api.put(`/api/rooms/${id}`, { ...data, id });
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/rooms/${id}`);
  },
};

export const bookingsApi = {
  getAll: async (): Promise<Booking[]> => {
    try {
      const response = await api.get<Booking[]>('/api/bookings');
      return response.data;
    } catch (error: any) {
      console.error('bookingsApi.getAll error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      // Return empty array instead of throwing to prevent crash
      return [];
    }
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
    userId?: string;
  }): Promise<Booking> => {
    const response = await api.post<Booking>('/api/bookings', data);
    return response.data;
  },
  updateStatus: async (id: number, status: string): Promise<void> => {
    await api.put(`/api/bookings/${id}/status`, { status });
  },
  cancel: async (id: number): Promise<void> => {
    await api.delete(`/api/bookings/${id}`);
  },
};

export const serviceRequestsApi = {
  getAll: async (): Promise<ServiceRequest[]> => {
    try {
      const response = await api.get<ServiceRequest[]>('/api/servicerequests');
      return response.data;
    } catch (error: any) {
      console.error('serviceRequestsApi.getAll error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      // Return empty array instead of throwing to prevent crash
      return [];
    }
  },
  create: async (data: {
    bookingId: number;
    serviceType: string;
    description: string;
  }): Promise<ServiceRequest> => {
    const response = await api.post<ServiceRequest>('/api/servicerequests', data);
    return response.data;
  },
  updateStatus: async (id: number, status: string, notes?: string): Promise<void> => {
    await api.put(`/api/servicerequests/${id}/status`, { status, notes });
  },
  assign: async (id: number, assignedToUserId: string): Promise<void> => {
    await api.put(`/api/servicerequests/${id}/assign`, { assignedToUserId });
  },
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  points?: number;
  membershipTier?: string;
  emailConfirmed?: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  role: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  password?: string;
}

export interface DatabaseData {
  users?: any[];
  roomTypes?: any[];
  rooms?: any[];
  bookings?: any[];
  payments?: any[];
  serviceRequests?: any[];
  housekeepingTasks?: any[];
  activityLogs?: any[];
  queryTickets?: any[];
  // PascalCase properties (from backend)
  Users?: any[];
  RoomTypes?: any[];
  Rooms?: any[];
  Bookings?: any[];
  Payments?: any[];
  ServiceRequests?: any[];
  HousekeepingTasks?: any[];
  ActivityLogs?: any[];
  QueryTickets?: any[];
}

export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>('/api/admin/users');
      return response.data;
    } catch (error: any) {
      console.error('adminApi.getUsers error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      // Return empty array instead of throwing to prevent crash
      return [];
    }
  },
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/api/admin/users/${id}`);
    return response.data;
  },
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<User>('/api/admin/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: UpdateUserData): Promise<void> => {
    await api.put(`/api/admin/users/${id}`, data);
  },
  deleteUser: async (id: string): Promise<any> => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response; // Return response to check for deactivation message
  },
  getDatabaseData: async (): Promise<DatabaseData> => {
    const response = await api.get<DatabaseData>('/api/admin/database');
    return response.data;
  },
};

export interface RoomType {
  id: number;
  name: string;
  description?: string;
  basePricePerNight: number;
  maxCapacity: number;
  size?: string;
  imageUrls: string[]; // Added
  amenities: string[]; // Added
  createdAt: string;
  updatedAt?: string;
}

export interface DutyRoster {
  id: number;
  staffId: string;
  staffName: string;
  staffEmail: string;
  date: string;
  shift: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  shiftType?: string; // Added optional shiftType property
}

export interface AuditLog {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  createdAt: string;
  updatedAt?: string;
}

export const roomTypesApi = {
  getAll: async (): Promise<RoomType[]> => {
    const response = await api.get<RoomType[]>('/api/roomtypes');
    return response.data;
  },
  getById: async (id: number): Promise<RoomType> => {
    const response = await api.get<RoomType>(`/api/roomtypes/${id}`);
    return response.data;
  },
  create: async (data: Partial<RoomType>): Promise<RoomType> => {
    const response = await api.post<RoomType>('/api/roomtypes', data);
    return response.data;
  },
  update: async (id: number, data: Partial<RoomType>): Promise<void> => {
    await api.put(`/api/roomtypes/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/roomtypes/${id}`);
  },
};

export const dutyRosterApi = {
  getAll: async (): Promise<DutyRoster[]> => {
    const response = await api.get<DutyRoster[]>('/api/dutyroster');
    return response.data;
  },
  getByStaff: async (staffId: string): Promise<DutyRoster[]> => {
    const response = await api.get<DutyRoster[]>(`/api/dutyroster/staff/${staffId}`);
    return response.data;
  },
  getByDate: async (date: string): Promise<DutyRoster[]> => {
    const response = await api.get<DutyRoster[]>(`/api/dutyroster/date/${date}`);
    return response.data;
  },
  create: async (data: Partial<DutyRoster>): Promise<DutyRoster> => {
    const response = await api.post<DutyRoster>('/api/dutyroster', data);
    return response.data;
  },
  update: async (id: number, data: Partial<DutyRoster>): Promise<void> => {
    await api.put(`/api/dutyroster/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/dutyroster/${id}`);
  },
};

export const auditLogApi = {
  getAll: async (params?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: AuditLog[]; totalCount: number; page: number; pageSize: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.entityType) queryParams.append('entityType', params.entityType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    const response = await api.get(`/api/auditlog?${queryParams.toString()}`);
    return response.data;
  },
  getById: async (id: number): Promise<AuditLog> => {
    const response = await api.get<AuditLog>(`/api/auditlog/${id}`);
    return response.data;
  },
};

// Housekeeping API
export interface HousekeepingTask {
  id: number;
  roomId: number;
  roomNumber: string;
  status: string; // Pending, InProgress, Completed
  notes?: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: number;
  userId: string;
  userName: string;
  bookingId?: number;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export const reviewsApi = {
  getAll: async (approvedOnly: boolean = true): Promise<Review[]> => {
    const response = await api.get<Review[]>(`/api/reviews?approvedOnly=${approvedOnly}`);
    return response.data;
  },
  getStats: async (): Promise<ReviewStats> => {
    const response = await api.get<ReviewStats>('/api/reviews/stats');
    return response.data;
  },
  create: async (data: { bookingId?: number; rating: number; comment?: string }): Promise<Review> => {
    const response = await api.post<Review>('/api/reviews', data);
    return response.data;
  },
};

export const housekeepingApi = {
  getAll: async (): Promise<HousekeepingTask[]> => {
    const response = await api.get<HousekeepingTask[]>('/api/housekeeping');
    return response.data;
  },
  getById: async (id: number): Promise<HousekeepingTask> => {
    const response = await api.get<HousekeepingTask>(`/api/housekeeping/${id}`);
    return response.data;
  },
  create: async (data: Partial<HousekeepingTask>): Promise<HousekeepingTask> => {
    const response = await api.post<HousekeepingTask>('/api/housekeeping', data);
    return response.data;
  },
  updateStatus: async (id: number, status: string): Promise<void> => {
    await api.put(`/api/housekeeping/${id}/status`, { status });
  },
  assign: async (id: number, userId: string): Promise<void> => {
    await api.put(`/api/housekeeping/${id}/assign`, { assignedUserId: userId }); // Ensure backend param matches
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/housekeeping/${id}`);
  },
};

export const bookingsApiExtended = {
  ...bookingsApi,
  checkIn: async (id: number): Promise<Booking> => {
    const response = await api.post<Booking>(`/api/bookings/${id}/checkin`);
    return response.data;
  },
  checkOut: async (id: number): Promise<Booking> => {
    const response = await api.post<Booking>(`/api/bookings/${id}/checkout`);
    return response.data;
  },
  getUpcomingCheckIns: async (days: number = 7): Promise<Booking[]> => {
    const response = await api.get<Booking[]>(`/api/bookings/upcoming-checkins?days=${days}`);
    return response.data;
  },
};

export default api;
