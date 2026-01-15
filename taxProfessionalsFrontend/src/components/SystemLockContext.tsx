import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getSystemStatus } from '../services/SystemSettings';
import type { SystemStatus } from '../services/SystemSettings';

interface SystemLockContextType {
  isSystemLocked: boolean;
  systemStatus: SystemStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SystemLockContext = createContext<SystemLockContextType | undefined>(undefined);

interface SystemLockProviderProps {
  children: ReactNode;
}

export const SystemLockProvider: React.FC<SystemLockProviderProps> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSystemStatus();
      if (response.data.success) {
        setSystemStatus(response.data.data);
      } else {
        setError('Failed to fetch system status');
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError('Failed to fetch system status');
      // Default to unlocked if we can't fetch status
      setSystemStatus({
        isSystemLocked: false,
        lockedAt: null,
        lockedByOfficerName: null,
        lastUpdatedAt: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    
    // Refetch every 5 minutes to keep status updated
    const interval = setInterval(fetchSystemStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value: SystemLockContextType = {
    isSystemLocked: systemStatus?.isSystemLocked ?? false,
    systemStatus,
    loading,
    error,
    refetch: fetchSystemStatus,
  };

  return (
    <SystemLockContext.Provider value={value}>
      {children}
    </SystemLockContext.Provider>
  );
};

export const useSystemLock = (): SystemLockContextType => {
  const context = useContext(SystemLockContext);
  if (context === undefined) {
    throw new Error('useSystemLock must be used within a SystemLockProvider');
  }
  return context;
};

export default SystemLockContext;
