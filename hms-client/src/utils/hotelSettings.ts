// Hotel Settings Utility
// Stores hotel name and other settings in localStorage
// Can be modified by admin

const HOTEL_SETTINGS_KEY = 'hotelSettings';

export interface HotelSettings {
  hotelName: string;
  welcomeDescription: string;
  email: string;
  phone: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  currency: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  membershipBenefits: MembershipBenefits;
  membershipDiscounts: MembershipDiscounts;
}

export interface MembershipBenefits {
  member: string[];
  silver: string[];
  gold: string[];
  platinum: string[];
}

export interface MembershipDiscounts {
  member: number; // Discount percentage (e.g., 10 = 10% off, so multiplier is 0.9)
  silver: number;
  gold: number;
  platinum: number;
}

const defaultSettings: HotelSettings = {
  hotelName: 'HMS Luxury Hotel',
  welcomeDescription: 'Experience the epitome of luxury and comfort in the heart of the city. Our hotel offers world-class amenities, breathtaking views, and exceptional service to make your stay unforgettable.',
  email: 'concierge@hmshotel.com',
  phone: '+1 (555) 123-4567',
  address: '123 Luxury Avenue, Beverly Hills, CA 90210',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  taxRate: 10,
  currency: 'USD',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  membershipBenefits: {
    member: ['Standard Member Rates', 'Free WiFi'],
    silver: ['5% Discount on bookings', 'Late Check-out'],
    gold: ['10% Discount on bookings', 'Room Upgrade (Subject to availability)', 'Late Check-out', 'Welcome Drink'],
    platinum: ['15% Discount on bookings', 'Room Upgrade (Subject to availability)', 'Late Check-out', 'Executive Lounge Access', 'Welcome Gift']
  },
  membershipDiscounts: {
    member: 10, // 10% discount
    silver: 15, // 15% discount
    gold: 20, // 20% discount
    platinum: 25 // 25% discount
  }
};

export const getHotelSettings = (): HotelSettings => {
  try {
    const stored = localStorage.getItem(HOTEL_SETTINGS_KEY);
    if (stored) {
      // Merge with default settings to ensure new fields exist if local storage has old data
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading hotel settings:', error);
  }
  return defaultSettings;
};

export const setHotelSettings = (settings: Partial<HotelSettings>): void => {
  try {
    const current = getHotelSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(HOTEL_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving hotel settings:', error);
  }
};

export const getHotelName = (): string => {
  return getHotelSettings().hotelName || defaultSettings.hotelName;
};

export const setHotelName = (name: string): void => {
  setHotelSettings({ hotelName: name });
};
