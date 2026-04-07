import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Chip, Surface, Button, Divider, FAB, Portal, Dialog, TextInput } from 'react-native-paper';
import client from '../../api/client';

const NOTIF_TYPES = [
    { key: 'low_stock', label: 'Low Stock Alert', icon: 'package-variant', color: '#EF4444' },
    { key: 'new_order', label: 'New Order', icon: 'cart', color: '#3B82F6' },
    { key: 'bulk_request', label: 'Bulk Request', icon: 'truck', color: '#F59E0B' },
    { key: 'system', label: 'System', icon: 'cog', color: '#64748B' },
];

const NotificationControl = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [composeVisible, setComposeVisible] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await client.get('notifications/');
            setNotifications(res.data);
        } catch (e) {
            // Graceful fallback — endpoint may not exist yet
            console.log('Notifications endpoint not available, using local mock');
            setNotifications([
                { id: 1, type: 'low_stock', message: 'Flour stock at Branch HQ dropped below threshold (2kg remaining).', created_at: new Date().toISOString(), is_read: false },
                { id: 2, type: 'new_order', message: 'New online order #45 placed at Kottayam Branch.', created_at: new Date().toISOString(), is_read: false },
                { id: 3, type: 'bulk_request', message: 'Bulk order #22 is awaiting approval for 500 bread loafs.', created_at: new Date().toISOString(), is_read: true },
                { id: 4, type: 'system', message: 'System backup completed successfully.', created_at: new Date(Date.now() - 86400000).toISOString(), is_read: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            await client.patch(`notifications/${id}/`, { is_read: true });
        } catch (e) { /* Silent fail */ }
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const getTypeMeta = (type) => {
        return NOTIF_TYPES.find(t => t.key === type) || { label: type, icon: 'bell', color: '#64748B' };
    };

    const filtered = filter === 'ALL'
        ? notifications
        : filter === 'UNREAD'
        ? notifications.filter(n => !n.is_read)
        : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#EF476F" />
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scroll}>
                        {/* Header Summary */}
                        <View style={styles.summaryRow}>
                            <Surface style={[styles.summaryCard, { backgroundColor: '#FFF1F2' }]} elevation={2}>
                                <Icon source="bell-ring" color="#EF476F" size={24} />
                                <Text style={[styles.summaryVal, { color: '#EF476F' }]}>{unreadCount}</Text>
                                <Text style={styles.summaryLabel}>Unread</Text>
                            </Surface>
                            <Surface style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]} elevation={2}>
                                <Icon source="bell-check" color="#16A34A" size={24} />
                                <Text style={[styles.summaryVal, { color: '#16A34A' }]}>{notifications.length - unreadCount}</Text>
                                <Text style={styles.summaryLabel}>Read</Text>
                            </Surface>
                            <Surface style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]} elevation={2}>
                                <Icon source="bell" color="#2563EB" size={24} />
                                <Text style={[styles.summaryVal, { color: '#2563EB' }]}>{notifications.length}</Text>
                                <Text style={styles.summaryLabel}>Total</Text>
                            </Surface>
                        </View>

                        {/* Filter Row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {['ALL', 'UNREAD', ...NOTIF_TYPES.map(t => t.key)].map(f => (
                                <Chip
                                    key={f}
                                    selected={filter === f}
                                    onPress={() => setFilter(f)}
                                    style={[styles.chip, filter === f && { backgroundColor: '#FCE7F3' }]}
                                    textStyle={filter === f ? { color: '#EF476F', fontWeight: 'bold' } : { color: '#64748B' }}
                                >{f === 'ALL' ? 'All' : f === 'UNREAD' ? 'Unread' : NOTIF_TYPES.find(t => t.key === f)?.label || f}</Chip>
                            ))}
                        </ScrollView>

                        {unreadCount > 0 && (
                            <Button mode="text" onPress={markAllRead} textColor="#EF476F" icon="check-all" style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
                                Mark All as Read
                            </Button>
                        )}

                        {/* Notification Cards */}
                        {filtered.length === 0 ? (
                            <Surface style={styles.emptyBox} elevation={1}>
                                <Icon source="bell-off" color="#CBD5E1" size={48} />
                                <Text style={styles.emptyText}>No notifications here.</Text>
                            </Surface>
                        ) : (
                            filtered.map(notif => {
                                const meta = getTypeMeta(notif.type);
                                return (
                                    <Card
                                        key={notif.id}
                                        style={[styles.notifCard, !notif.is_read && styles.unreadCard]}
                                        onPress={() => markRead(notif.id)}
                                    >
                                        <Card.Content style={styles.notifContent}>
                                            <View style={[styles.iconBox, { backgroundColor: `${meta.color}15` }]}>
                                                <Icon source={meta.icon} color={meta.color} size={22} />
                                            </View>
                                            <View style={styles.notifBody}>
                                                <View style={styles.notifTopRow}>
                                                    <Chip style={[styles.typeChip, { backgroundColor: `${meta.color}15` }]}
                                                        textStyle={{ color: meta.color, fontSize: 10, fontWeight: 'bold' }}>
                                                        {meta.label}
                                                    </Chip>
                                                    {!notif.is_read && (
                                                        <View style={styles.unreadDot} />
                                                    )}
                                                </View>
                                                <Text style={styles.notifMessage}>{notif.message}</Text>
                                                <Text style={styles.notifTime}>
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </Text>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                );
                            })
                        )}

                        <Button icon="refresh" mode="outlined" onPress={fetchNotifications} style={{ marginTop: 16, marginBottom: 80 }} textColor="#EF476F">
                            Refresh
                        </Button>
                    </ScrollView>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, marginTop: 80 },
    scroll: { padding: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    summaryCard: { width: '31%', padding: 12, borderRadius: 14, alignItems: 'center' },
    summaryVal: { fontSize: 24, fontWeight: '900', marginTop: 6 },
    summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
    filterScroll: { marginBottom: 12 },
    chip: { marginRight: 8, backgroundColor: '#E2E8F0' },
    notifCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10, elevation: 1 },
    unreadCard: { borderLeftWidth: 3, borderLeftColor: '#EF476F', elevation: 3 },
    notifContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    notifBody: { flex: 1 },
    notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    typeChip: { height: 22 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF476F' },
    notifMessage: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
    notifTime: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
    emptyBox: { padding: 40, borderRadius: 16, alignItems: 'center', backgroundColor: '#F8FAFC', marginTop: 40 },
    emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 16 },
});

export default NotificationControl;
