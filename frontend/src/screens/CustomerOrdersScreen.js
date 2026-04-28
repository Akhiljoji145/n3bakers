import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
    Appbar, Title, Paragraph, Chip, Text, Surface,
    Divider, Icon, ActivityIndicator, Button
} from 'react-native-paper';
import client from '../api/client';
import useAutoRefresh from '../hooks/useAutoRefresh';

const CustomerOrdersScreen = ({ onClose }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingId, setConfirmingId] = useState(null); // tracks which order is being confirmed

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
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error('Fetch orders error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const handleCancelOrder = (orderId) => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order? This action cannot be undone.",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await client.post(`orders/orders/${orderId}/cancel/`);
                            fetchOrders({ silent: true });
                        } catch (e) {
                            console.error('Cancel order error', e);
                            Alert.alert('Error', 'Could not cancel order. It might already be in preparation.');
                        }
                    }
                }
            ]
        );
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING':   return { label: 'Pending Approval',    color: '#F59E0B', icon: 'clock-outline' };
            case 'PREPARING': return { label: 'In the Oven 🔥',      color: '#3B82F6', icon: 'fire' };
            case 'READY':     return { label: 'Ready for Pickup! 🎯', color: '#10B981', icon: 'check-circle' };
            case 'DELIVERED': return { label: 'Picked Up ✅',         color: '#64748B', icon: 'package-variant-closed' };
            case 'CANCELLED': return { label: 'Cancelled',            color: '#EF4444', icon: 'close-circle-outline' };
            default:          return { label: status,                  color: '#94A3B8', icon: 'information-outline' };
        }
    };

    // Split orders into active and past
    const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
    const pastOrders   = orders.filter(o =>  ['DELIVERED', 'CANCELLED'].includes(o.status));

    const renderOrder = (order) => {
        const statusInfo = getStatusInfo(order.status);
        const isReady = order.status === 'READY';
        const isConfirming = confirmingId === order.id;

        return (
            <Surface key={order.id} style={[styles.orderCard, isReady && styles.readyCard]} elevation={isReady ? 3 : 1}>
                {/* Ready banner */}
                {isReady && (
                    <View style={styles.readyBanner}>
                        <Icon source="bell-ring" size={16} color="#065F46" />
                        <Text style={styles.readyBannerText}>Your order is waiting at the bakery!</Text>
                    </View>
                )}

                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderId}>Order #{order.id}</Text>
                        <Text style={styles.timestamp}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <Chip
                        icon={statusInfo.icon}
                        style={{ backgroundColor: `${statusInfo.color}18` }}
                        textStyle={{ color: statusInfo.color, fontWeight: '800', fontSize: 11 }}
                    >
                        {statusInfo.label}
                    </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.branchRow}>
                    <Icon source="store" size={16} color="#64748B" />
                    <Text style={styles.branchName}> {order.branch_name}</Text>
                </View>

                <View style={styles.itemsBlock}>
                    {(order.items || []).map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemQty}>{item.quantity}×</Text>
                            <Text style={styles.itemName}>{item.product_name || `Product #${item.product}`}</Text>
                            <Text style={styles.itemPrice}>₹{item.price_at_order}</Text>
                        </View>
                    ))}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                </View>

                {!order.payment_status && order.status !== 'CANCELLED' && (
                    <View style={styles.paymentBanner}>
                        <Icon source="cash-marker" size={15} color="#9A3412" />
                        <Text style={styles.paymentText}> Pay at counter requested</Text>
                    </View>
                )}

                {['PENDING', 'PREPARING'].includes(order.status) && (
                    <Button 
                        mode="outlined" 
                        onPress={() => handleCancelOrder(order.id)}
                        style={styles.cancelBtn}
                        textColor="#EF4444"
                        icon="close-circle-outline"
                    >
                        Cancel Order
                    </Button>
                )}

            </Surface>
        );
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="My Orders" titleStyle={styles.headerTitle} />
                <Appbar.Action icon="refresh" onPress={onRefresh} />
            </Appbar.Header>

            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#D2691E" />
                    <Text style={styles.loadingText}>Fetching your bakery treats…</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D2691E']} />}
                >
                    <Title style={styles.pageTitle}>Order Tracking</Title>
                    <Paragraph style={styles.subTitle}>Track your active and past orders here.</Paragraph>

                    {orders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon source="clipboard-text-outline" size={64} color="#E2E8F0" />
                            <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
                        </View>
                    ) : (
                        <>
                            {/* Active orders */}
                            {activeOrders.length > 0 && (
                                <>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.sectionDot} />
                                        <Text style={styles.sectionLabel}>Active Orders ({activeOrders.length})</Text>
                                    </View>
                                    {activeOrders.map(renderOrder)}
                                </>
                            )}

                            {/* Past orders */}
                            {pastOrders.length > 0 && (
                                <>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionDot, { backgroundColor: '#94A3B8' }]} />
                                        <Text style={[styles.sectionLabel, { color: '#94A3B8' }]}>Past Orders ({pastOrders.length})</Text>
                                    </View>
                                    {pastOrders.map(renderOrder)}
                                </>
                            )}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { backgroundColor: '#FFFFFF', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontWeight: '800', color: '#1E293B' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
    scroll: { padding: 16 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
    subTitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
    sectionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D2691E', marginRight: 8 },
    sectionLabel: { fontSize: 13, fontWeight: '800', color: '#D2691E', textTransform: 'uppercase', letterSpacing: 0.5 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 16 },
    orderCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        marginBottom: 16, overflow: 'hidden',
    },
    readyCard: {
        borderWidth: 2, borderColor: '#10B981',
    },
    readyBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10, marginBottom: 14, gap: 8,
    },
    readyBannerText: { color: '#065F46', fontWeight: '700', fontSize: 13 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderId: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    timestamp: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    branchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    branchName: { fontSize: 14, color: '#475569', fontWeight: '600' },
    itemsBlock: { marginBottom: 4 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    itemQty: { fontSize: 14, fontWeight: '900', color: '#D2691E', width: 28 },
    itemName: { flex: 1, fontSize: 14, color: '#1E293B' },
    itemPrice: { fontSize: 14, fontWeight: '600', color: '#475569' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    paymentBanner: {
        marginTop: 12, backgroundColor: '#FFF7ED', padding: 8,
        borderRadius: 8, flexDirection: 'row', alignItems: 'center',
    },
    paymentText: { color: '#9A3412', fontSize: 12, fontWeight: '800' },
    pickupBtnLabel: { fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
    cancelBtn: {
        marginTop: 12,
        borderColor: '#EF4444',
        borderRadius: 8,
    },
});

export default CustomerOrdersScreen;
