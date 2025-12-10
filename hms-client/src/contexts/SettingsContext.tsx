import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsApi, ParsedHotelSetting } from '../services/api';

interface SettingsContextType {
  settings: ParsedHotelSetting | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: ParsedHotelSetting) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ParsedHotelSetting | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load hotel settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: ParsedHotelSetting) => {
    try {
      const updated = await settingsApi.update(newSettings);
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};





