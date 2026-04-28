import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import client from '../api/client';
import * as Notifications from 'expo-notifications';
import { DeviceEventEmitter } from 'react-native';
import { playNotificationSound } from '../utils/notificationSound';
import { DATA_REFRESH_EVENT } from './useAutoRefresh';

const normalizeNotifications = (payload) => (Array.isArray(payload) ? payload : []);

const useNotifications = ({ enabled = true, intervalMs = 15000, limit } = {}) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const knownUnreadIdsRef = useRef(new Set());
    const firstLoadRef = useRef(true);

    const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
        if (!enabled) {
            return [];
        }

        if (!silent) {
            setLoading(true);
        }

        try {
            const response = await client.get('notifications/', {
                params: limit ? { limit } : undefined,
            });
            const nextNotifications = normalizeNotifications(response.data);
            const nextUnreadIds = new Set(
                nextNotifications.filter((notification) => !notification.is_read).map((notification) => notification.id)
            );

            if (!firstLoadRef.current) {
                const newUnread = nextNotifications.filter(
                    (n) => !n.is_read && !knownUnreadIdsRef.current.has(n.id)
                );
                
                if (newUnread.length > 0) {
                    playNotificationSound();
                    
                    // Trigger global refresh for all screens listening
                    DeviceEventEmitter.emit(DATA_REFRESH_EVENT);
                    
                    // Trigger a native system notification for each new item
                    for (const item of newUnread) {
                        try {
                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: item.title || 'N3 Bakers Update',
                                    body: item.message,
                                    data: item.metadata || {},
                                },
                                trigger: null, // deliver immediately
                            });
                        } catch (notifErr) {
                            console.error('Failed to schedule local notification', notifErr);
                        }
                    }
                }
            }

            knownUnreadIdsRef.current = nextUnreadIds;
            firstLoadRef.current = false;
            setNotifications(nextNotifications);
            setError(null);
            return nextNotifications;
        } catch (fetchError) {
            setError(fetchError);
            return [];
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [enabled, limit]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        fetchNotifications();
        const intervalId = setInterval(() => {
            fetchNotifications({ silent: true });
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [enabled, fetchNotifications, intervalMs]);

    const markRead = useCallback(async (id) => {
        setNotifications((current) => current.map((item) => (
            item.id === id ? { ...item, is_read: true } : item
        )));
        knownUnreadIdsRef.current.delete(id);
        try {
            await client.patch(`notifications/${id}/`, { is_read: true });
        } catch (markError) {
            setError(markError);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        const unreadIds = notifications.filter((item) => !item.is_read).map((item) => item.id);
        if (!unreadIds.length) {
            return;
        }

        setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
        knownUnreadIdsRef.current = new Set();
        try {
            await client.post('notifications/mark-all-read/');
        } catch (markError) {
            setError(markError);
        }
    }, [notifications]);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.is_read).length,
        [notifications]
    );

    const deleteNotification = useCallback(async (id) => {
        // Optimistic remove from local state immediately
        setNotifications((current) => current.filter((item) => item.id !== id));
        knownUnreadIdsRef.current.delete(id);
        try {
            await client.delete(`notifications/${id}/`);
        } catch (deleteError) {
            // Revert on failure
            setError(deleteError);
            fetchNotifications({ silent: true });
        }
    }, [fetchNotifications]);

    return {
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,
    };
};

export default useNotifications;
