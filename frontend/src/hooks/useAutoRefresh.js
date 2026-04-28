import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';

export const DATA_REFRESH_EVENT = 'DATA_REFRESH';

/**
 * Custom hook to listen for a global data refresh event.
 * Useful for refreshing screens when new notifications or background updates occur.
 * 
 * @param {Function} onRefresh - Callback function to execute when refresh is triggered.
 * @param {Array} deps - Dependency array for the effect.
 */
const useAutoRefresh = (onRefresh, deps = []) => {
    useEffect(() => {
        if (!onRefresh) return;

        // Listen for the global refresh event
        const subscription = DeviceEventEmitter.addListener(DATA_REFRESH_EVENT, () => {
            console.log('[AutoRefresh] Refresh event received, triggering callback...');
            onRefresh();
        });

        return () => {
            subscription.remove();
        };
    }, [onRefresh, ...deps]);
};

export default useAutoRefresh;
