import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '../store/appStore';

export function useNetworkStatus() {
  const simulateOfflineMode = useAppStore((s) => s.simulateOfflineMode);
  const triggerGlobalRefresh = useAppStore((s) => s.triggerGlobalRefresh);
  const [deviceOnline, setDeviceOnline] = useState<boolean>(
    Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setDeviceOnline(true);
        triggerGlobalRefresh();
      };
      const handleOffline = () => setDeviceOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const nextOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      setDeviceOnline((prev) => {
        if (!prev && nextOnline) {
          triggerGlobalRefresh();
        }
        return nextOnline;
      });
    });

    return () => unsubscribe();
  }, [triggerGlobalRefresh]);

  return {
    isOnline: !simulateOfflineMode && deviceOnline,
  };
}
