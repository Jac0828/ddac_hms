import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, LoginRequest, RegisterRequest, LoginResponse } from '../services/api';

interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
  points?: number;
  membershipTier?: string;
  emailConfirmed?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isReceptionist: boolean;
  isRoomAttendant: boolean;
  isHousekeeping: boolean;
  isCustomer: boolean;
  updateUser: (user: User, token?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore authentication state from localStorage
    const storedToken = localStorage.getItem('jwtToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const updateUser = (updatedUser: User, newToken?: string) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (newToken) {
        setToken(newToken);
        localStorage.setItem('jwtToken', newToken);
    }
  };

  const login = async (data: LoginRequest) => {
    const response: LoginResponse = await authApi.login(data);
    setToken(response.token);
    const userData: User = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      phoneNumber: response.phoneNumber,
      roles: response.roles,
      points: response.points,
      membershipTier: response.membershipTier,
      emailConfirmed: response.emailConfirmed ?? false,
    };
    setUser(userData);
    localStorage.setItem('jwtToken', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const googleLogin = async (accessToken: string) => {
    const response: LoginResponse = await authApi.googleLogin(accessToken);
    setToken(response.token);
    const userData: User = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      phoneNumber: response.phoneNumber,
      roles: response.roles,
      points: response.points,
      membershipTier: response.membershipTier,
      emailConfirmed: response.emailConfirmed ?? true, // Google users are pre-verified
    };
    setUser(userData);
    localStorage.setItem('jwtToken', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
    // Auto-login after registration
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isManager = user?.roles.includes('Manager') ?? false;
  const isReceptionist = user?.roles.includes('Receptionist') ?? false;
  const isRoomAttendant = user?.roles.includes('RoomAttendant') || user?.roles.includes('Housekeeping') || false;
  const isHousekeeping = isRoomAttendant;
  const isCustomer = user?.roles.includes('Customer') ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        googleLogin,
        register,
        logout,
        isAuthenticated,
        isLoading,
        isAdmin,
        isManager,
        isReceptionist,
        isRoomAttendant,
        isHousekeeping,
        isCustomer,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

