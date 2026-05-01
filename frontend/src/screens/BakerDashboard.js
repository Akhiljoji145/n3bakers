import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Title, Appbar, List, Button, Paragraph, Chip, Card, Text, Icon, Divider, ActivityIndicator } from 'react-native-paper';
import client from '../api/client';
import useNotifications from '../hooks/useNotifications';
import useAutoRefresh from '../hooks/useAutoRefresh';

const BakerDashboard = ({ onLogout, user, activeRole, onSwitchRole }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const { notifications, unreadCount, markRead } = useNotifications({ limit: 6 });

    useEffect(() => {
        fetchOrders();
    }, []);

    useAutoRefresh(() => {
        fetchOrders({ silent: true });
    });

    const fetchOrders = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const response = await client.get('orders/orders/');
            // Bakers handle kitchen preparation only
            const relevantOrders = (Array.isArray(response.data) ? response.data : [])
                .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
            setOrders(relevantOrders);
        } catch (e) {
            console.error('Fetch orders failed', e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await client.patch(`orders/orders/${orderId}/`, { status });
            fetchOrders({ silent: true });
        } catch (e) {
            console.error('Status update failed', e);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING': return '#F59E0B';
            case 'PREPARING': return '#3B82F6';
            case 'READY': return '#10B981';
            default: return '#94A3B8';
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content title="Kitchen View (Baker)" titleStyle={styles.headerTitle} />
                <Appbar.Action icon="refresh" onPress={() => fetchOrders()} />
                {onSwitchRole && (
                    <TouchableOpacity
                        onPress={onSwitchRole}
                        style={styles.switchRoleBtn}
                        activeOpacity={0.8}
                    >
                        <Icon source="swap-horizontal" size={14} color="#4D96FF" />
                        <Text style={[styles.switchRoleBtnText]}>
                            {user.role === activeRole ? user.secondary_role : user.role}
                        </Text>
                    </TouchableOpacity>
                )}
                <Appbar.Action icon="logout" onPress={onLogout} />
            </Appbar.Header>

            <ScrollView style={styles.scroll}>
                {/* Notifications Panel */}
                <Card style={styles.alertCard}>
                    <Card.Content>
                        <View style={styles.alertHeader}>
                            <Title style={styles.alertTitle}>Kitchen Alerts</Title>
                            <Chip style={styles.alertCountChip} textStyle={{ color: '#9A3412', fontWeight: 'bold' }}>
                                {unreadCount} unread
                            </Chip>
                        </View>
                        {notifications.length === 0 ? (
                            <Text style={styles.alertEmpty}>No new kitchen notifications.</Text>
                        ) : (
                            notifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    style={[styles.alertItem, !notification.is_read && styles.alertUnread]}
                                    onPress={() => markRead(notification.id)}
                                >
                                    <View style={styles.alertItemContent}>
                                        <Text style={styles.alertItemTitle}>{notification.title}</Text>
                                        <Text style={styles.alertItemMessage}>{notification.message}</Text>
                                    </View>
                                </Card>
                            ))
                        )}
                    </Card.Content>
                </Card>

                <Title style={styles.title}>Orders in Queue</Title>
                
                {loading && orders.length === 0 ? (
                    <ActivityIndicator size="large" color="#D2691E" style={{ marginTop: 20 }} />
                ) : orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon source="bread-slice" size={64} color="#E2E8F0" />
                        <Paragraph style={styles.empty}>Kitchen is clear! 🥖</Paragraph>
                    </View>
                ) : (
                    orders.map(order => (
                        <List.Accordion
                            key={order.id}
                            title={`Order #${order.id}${order.order_type === 'CUSTOM' ? '  [CUSTOM]' : ''}`}
                            description={
                                order.order_type === 'CUSTOM' && order.custom_details
                                    ? `Custom: ${order.custom_details.item_wanted} x ${order.custom_details.quantity} — Due: ${new Date(order.custom_details.delivery_date).toLocaleDateString()}`
                                    : (order.items?.map(i => `${i.product_name} x ${i.quantity}`).join(', ') || 'No items')
                            }
                            left={props => (
                                <View style={styles.statusBox}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                                </View>
                            )}
                            style={[styles.accordion, { borderLeftColor: getStatusColor(order.status) }]}
                            titleStyle={styles.orderTitle}
                        >
                            <View style={styles.detailsBox}>
                                <View style={styles.itemsList}>
                                    <Text style={styles.detailsLabel}>{order.order_type === 'CUSTOM' ? 'Custom Order Details:' : 'Ingredients / Products to Prepare:'}</Text>
                                    <Divider style={styles.itemDivider} />
                                    {order.order_type === 'CUSTOM' && order.custom_details ? (
                                        <View>
                                            <View style={styles.itemRow}>
                                                <Icon source="circle-medium" size={20} color="#D2691E" />
                                                <Text style={styles.itemText}><Text style={styles.qtyText}>Item:</Text> {order.custom_details.item_wanted}</Text>
                                            </View>
                                            <View style={styles.itemRow}>
                                                <Icon source="circle-medium" size={20} color="#D2691E" />
                                                <Text style={styles.itemText}><Text style={styles.qtyText}>Qty:</Text> {order.custom_details.quantity} units</Text>
                                            </View>
                                            <View style={styles.itemRow}>
                                                <Icon source="circle-medium" size={20} color="#D2691E" />
                                                <Text style={styles.itemText}><Text style={styles.qtyText}>Deliver by:</Text> {new Date(order.custom_details.delivery_date).toLocaleString()}</Text>
                                            </View>
                                            <View style={styles.itemRow}>
                                                <Icon source="circle-medium" size={20} color="#D2691E" />
                                                <Text style={styles.itemText}><Text style={styles.qtyText}>Customer:</Text> {order.custom_details.customer_name}{order.custom_details.customer_phone ? ` (${order.custom_details.customer_phone})` : ''}</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        (order.items || []).map((item, idx) => (
                                            <View key={idx} style={styles.itemRow}>
                                                <Icon source="circle-medium" size={20} color="#D2691E" />
                                                <Text style={styles.itemText}>
                                                    <Text style={styles.qtyText}>{item.quantity}x</Text> {item.product_name || `Product #${item.product}`}
                                                </Text>
                                            </View>
                                        ))
                                    )}
                                </View>

                                <View style={styles.actions}>
                                    {order.status === 'PENDING' && (
                                        <Button 
                                            mode="contained" 
                                            buttonColor="#3B82F6" 
                                            style={styles.actionButton}
                                            icon="fire"
                                            onPress={() => updateStatus(order.id, 'PREPARING')}
                                        >
                                            Start Baking
                                        </Button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <Button 
                                            mode="contained" 
                                            buttonColor="#10B981" 
                                            style={styles.actionButton}
                                            icon="check-bold"
                                            onPress={() => updateStatus(order.id, 'READY')}
                                        >
                                            Mark as Ready
                                        </Button>
                                    )}
                                </View>
                            </View>
                        </List.Accordion>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { backgroundColor: '#FFFFFF', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontWeight: '800', color: '#1E293B' },
    switchRoleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginRight: 4,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    switchRoleBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4D96FF',
        letterSpacing: 0.4,
    },
    scroll: { padding: 12 },
    alertCard: { marginBottom: 20, borderRadius: 16, backgroundColor: '#FFF7ED', elevation: 0, borderWidth: 1, borderColor: '#FFEDD5' },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    alertTitle: { marginBottom: 0, color: '#9A3412', fontSize: 18, fontWeight: 'bold' },
    alertCountChip: { backgroundColor: '#FED7AA' },
    alertEmpty: { color: '#C2410C', fontStyle: 'italic', textAlign: 'center' },
    alertItem: { marginBottom: 8, borderRadius: 12, backgroundColor: '#FFFFFF', elevation: 1 },
    alertUnread: { borderLeftWidth: 4, borderLeftColor: '#F97316' },
    alertItemContent: { padding: 12 },
    alertItemTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    alertItemMessage: { fontSize: 13, color: '#475569' },
    title: { marginBottom: 12, fontWeight: '900', color: '#1E293B', fontSize: 20 },
    accordion: { backgroundColor: '#FFFFFF', borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, elevation: 1 },
    orderTitle: { fontWeight: '700', color: '#0F172A' },
    statusBox: { justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    detailsBox: { backgroundColor: '#F1F5F9', padding: 16, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
    itemsList: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 16 },
    detailsLabel: { fontSize: 12, color: '#64748B', fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    itemDivider: { marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    itemText: { fontSize: 16, color: '#1E293B', flex: 1 },
    qtyText: { fontWeight: '900', color: '#D2691E' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end' },
    actionButton: { borderRadius: 8, paddingHorizontal: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    empty: { textAlign: 'center', marginTop: 16, fontSize: 18, color: '#94A3B8' },
});

export default BakerDashboard;
