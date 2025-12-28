import { useState, useEffect, useCallback } from 'react';

type NetworkState = {
  isOnline: boolean;
  wasOffline: boolean;
};

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  });

  const updateOnlineStatus = useCallback(() => {
    const online = navigator.onLine;
    setNetworkState(prev => ({
      isOnline: online,
      wasOffline: prev.wasOffline || !online,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  return networkState;
}
