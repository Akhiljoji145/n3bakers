import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Icon, Surface, Button, IconButton, Divider } from 'react-native-paper';
import useNotifications from '../hooks/useNotifications';

const NOTIF_TYPES = [
    { key: 'LOW_STOCK',            label: 'Low Stock',     icon: 'alert-circle',                 color: '#EF4444', bg: '#FEF2F2' },
    { key: 'NEW_ORDER',            label: 'New Order',     icon: 'cart-plus',                    color: '#2563EB', bg: '#EFF6FF' },
    { key: 'BAKING_STARTED',       label: 'Baking',        icon: 'chef-hat',                     color: '#D97706', bg: '#FFFBEB' },
    { key: 'ITEM_UPDATED',         label: 'Updated',       icon: 'pencil-circle',                color: '#7C3AED', bg: '#F5F3FF' },
    { key: 'ORDER_READY',          label: 'Ready',         icon: 'check-circle',                 color: '#059669', bg: '#ECFDF5' },
    { key: 'ORDER_STATUS_CHANGED', label: 'Status',        icon: 'swap-horizontal-circle',       color: '#4F46E5', bg: '#EEF2FF' },
    { key: 'ORDER_PICKED_UP',      label: 'Picked Up',     icon: 'package-variant', color: '#0D9488', bg: '#F0FDFA' },
];

const FILTERS = ['ALL', 'UNREAD', ...NOTIF_TYPES.map(t => t.key)];

/* Human-readable relative time */
const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const NotificationCenter = () => {
    const [filter, setFilter] = useState('ALL');
    const { notifications, loading, unreadCount, fetchNotifications, markRead, markAllRead, deleteNotification } = useNotifications();

    const filtered = useMemo(() => {
        if (filter === 'ALL')    return notifications;
        if (filter === 'UNREAD') return notifications.filter(n => !n.is_read);
        return notifications.filter(n => n.type === filter);
    }, [filter, notifications]);

    const getTypeMeta = (type) =>
        NOTIF_TYPES.find(t => t.key === type) || { label: type, icon: 'bell', color: '#64748B', bg: '#F1F5F9' };

    const confirmDelete = (id) => {
        Alert.alert(
            'Remove Notification',
            'This will be removed only for you.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => deleteNotification(id) },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#EF476F" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Header stats ── */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: '#FFF1F2' }]}>
                            <Icon source="bell-ring" color="#EF476F" size={20} />
                            <Text style={[styles.statNum, { color: '#EF476F' }]}>{unreadCount}</Text>
                            <Text style={styles.statLbl}>Unread</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
                            <Icon source="bell-check" color="#16A34A" size={20} />
                            <Text style={[styles.statNum, { color: '#16A34A' }]}>{notifications.length - unreadCount}</Text>
                            <Text style={styles.statLbl}>Read</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
                            <Icon source="bell" color="#2563EB" size={20} />
                            <Text style={[styles.statNum, { color: '#2563EB' }]}>{notifications.length}</Text>
                            <Text style={styles.statLbl}>Total</Text>
                        </View>
                    </View>

                    {/* ── Filter pills ── */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
                        {FILTERS.map(value => {
                            const meta = value === 'ALL' ? null : value === 'UNREAD' ? null : NOTIF_TYPES.find(t => t.key === value);
                            const isActive = filter === value;
                            return (
                                <TouchableOpacity
                                    key={value}
                                    onPress={() => setFilter(value)}
                                    style={[
                                        styles.filterPill,
                                        isActive && { backgroundColor: meta?.color || '#EF476F', borderColor: meta?.color || '#EF476F' }
                                    ]}
                                    activeOpacity={0.75}
                                >
                                    {meta && <Icon source={meta.icon} color={isActive ? '#FFFFFF' : meta.color} size={13} />}
                                    <Text style={[
                                        styles.filterPillText,
                                        isActive ? { color: '#FFFFFF', fontWeight: '700' } : { color: '#475569' }
                                    ]}>
                                        {value === 'ALL' ? 'All' : value === 'UNREAD' ? `Unread (${unreadCount})` : meta?.label || value}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* ── Actions row ── */}
                    <View style={styles.actionsRow}>
                        <Text style={styles.resultsCount}>
                            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
                        </Text>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={markAllRead} style={styles.markAllPill} activeOpacity={0.75}>
                                <Icon source="check-all" color="#EF476F" size={15} />
                                <Text style={styles.markAllText}>Mark all read</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── Empty state ── */}
                    {filtered.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Icon source="bell-sleep" color="#CBD5E1" size={56} />
                            <Text style={styles.emptyTitle}>All clear!</Text>
                            <Text style={styles.emptyHint}>No notifications in this category.</Text>
                        </View>
                    ) : (
                        filtered.map((notif, index) => {
                            const meta = getTypeMeta(notif.type);
                            const isUnread = !notif.is_read;
                            return (
                                <View key={notif.id}>
                                    <TouchableOpacity
                                        style={[styles.notifRow, isUnread && styles.notifRowUnread]}
                                        activeOpacity={0.7}
                                        onPress={() => markRead(notif.id)}
                                    >
                                        {/* Unread accent bar */}
                                        {isUnread && <View style={[styles.accentBar, { backgroundColor: meta.color }]} />}

                                        {/* Icon */}
                                        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                                            <Icon source={meta.icon} color={meta.color} size={22} />
                                        </View>

                                        {/* Content */}
                                        <View style={styles.notifContent}>
                                            <View style={styles.notifHeader}>
                                                <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                                                    <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                                                </View>
                                                <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
                                            </View>
                                            <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={1}>
                                                {notif.title}
                                            </Text>
                                            <Text style={styles.notifMessage} numberOfLines={2}>
                                                {notif.message}
                                            </Text>
                                        </View>

                                        {/* Delete */}
                                        <IconButton
                                            icon="close"
                                            size={16}
                                            iconColor="#CBD5E1"
                                            style={styles.delBtn}
                                            onPress={() => confirmDelete(notif.id)}
                                        />
                                    </TouchableOpacity>
                                    {index < filtered.length - 1 && <Divider style={styles.rowDivider} />}
                                </View>
                            );
                        })
                    )}

                    {/* ── Refresh ── */}
                    <Button
                        icon="refresh"
                        mode="outlined"
                        onPress={() => fetchNotifications()}
                        style={styles.refreshBtn}
                        textColor="#EF476F"
                    >
                        Refresh
                    </Button>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, marginTop: 80 },
    scroll: { padding: 16, paddingBottom: 40 },

    /* Stats */
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    statBox: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 4 },
    statNum: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
    statLbl: { fontSize: 11, color: '#64748B', fontWeight: '600' },

    /* Filter bar */
    filterBar: { marginBottom: 14 },
    filterBarContent: { paddingRight: 8, gap: 8, flexDirection: 'row' },
    filterPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    },
    filterPillText: { fontSize: 12, fontWeight: '600' },

    /* Actions row */
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    resultsCount: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    markAllPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#FFF1F2' },
    markAllText: { color: '#EF476F', fontSize: 12, fontWeight: '700' },

    /* Notification rows */
    notifRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 14,
        paddingVertical: 12, paddingRight: 4, paddingLeft: 14,
        overflow: 'hidden', position: 'relative',
    },
    notifRowUnread: { backgroundColor: '#FAFEFF' },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4 },
    iconWrap: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    notifContent: { flex: 1 },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    notifTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
    notifTitle: { fontSize: 14, color: '#475569', fontWeight: '600', marginBottom: 3 },
    notifTitleUnread: { color: '#0F172A', fontWeight: '800' },
    notifMessage: { fontSize: 13, color: '#64748B', lineHeight: 18 },
    delBtn: { margin: 0, marginLeft: 2 },
    rowDivider: { backgroundColor: '#F1F5F9', marginLeft: 72 },

    /* Empty */
    emptyBox: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#CBD5E1', marginTop: 16 },
    emptyHint: { fontSize: 14, color: '#CBD5E1', marginTop: 6 },

    refreshBtn: { marginTop: 20, marginBottom: 30 },
});

export default NotificationCenter;
