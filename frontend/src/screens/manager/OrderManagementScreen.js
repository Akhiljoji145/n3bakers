import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Card, Title, Text, Button, List, ActivityIndicator, Chip, Icon } from 'react-native-paper';
import client from '../../api/client';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const OrderManagementScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

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
            // Managers should see every active branch order, including counter-pay orders.
            setOrders(
                (Array.isArray(response.data) ? response.data : [])
                    .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
            );
        } catch (e) {
            console.error('Fetch orders error', e);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await client.patch(`orders/orders/${orderId}/`, { status: newStatus });
            fetchOrders();
        } catch (e) {
            console.error('Status update failed', e);
            if (Platform.OS === 'web') alert("Failed to update status.");
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING': return '#F59E0B';
            case 'PREPARING': return '#3B82F6';
            case 'READY': return '#10B981';
            case 'DELIVERED': return '#64748B';
            default: return '#94A3B8';
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#D2691E" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    
                    <View style={styles.row}>
                        <Card style={styles.statCard}>
                            <Card.Content>
                                <Title style={{ color: '#64748B', fontSize: 14 }}>Waiting (Pending)</Title>
                                <Title style={[styles.count, { color: '#F59E0B' }]}>{orders.filter(o => o.status === 'PENDING').length}</Title>
                            </Card.Content>
                        </Card>
                        <Card style={styles.statCard}>
                            <Card.Content>
                                <Title style={{ color: '#64748B', fontSize: 14 }}>In Kitchen</Title>
                                <Title style={[styles.count, { color: '#3B82F6' }]}>{orders.filter(o => o.status === 'PREPARING').length}</Title>
                            </Card.Content>
                        </Card>
                        <Card style={styles.statCard}>
                            <Card.Content>
                                <Title style={{ color: '#64748B', fontSize: 14 }}>Ready for Pickup</Title>
                                <Title style={[styles.count, { color: '#10B981' }]}>{orders.filter(o => o.status === 'READY').length}</Title>
                            </Card.Content>
                        </Card>
                    </View>

                    <Title style={styles.sectionTitle}>Active Order Flow Queue</Title>
                    {orders.length === 0 ? (
                        <Text style={styles.empty}>All caught up! No active orders in the queue.</Text>
                    ) : (
                        orders.map(order => (
                            <List.Accordion
                                key={order.id}
                                title={`Order #${order.id} - ₹${order.total_amount}`}
                                description={
                                    order.order_type === 'CUSTOM' && order.custom_details 
                                        ? `Custom: ${order.custom_details.item_wanted} x ${order.custom_details.quantity}`
                                        : ((order.items || []).map(i => `${i.product_name} x ${i.quantity}`).join(', ') || 'No items')
                                }
                                left={props => <View style={styles.iconBox}><Icon source="receipt" size={24} color="#64748B" /></View>}
                                style={[styles.accordion, { borderLeftColor: getStatusColor(order.status) }]}
                                titleStyle={styles.orderTitle}
                            >
                                <View style={styles.detailsBox}>
                                    <View style={styles.badgeRow}>
                                        <Text style={styles.detailText}>Current Status:</Text>
                                        <Chip style={{ backgroundColor: `${getStatusColor(order.status)}20`, marginHorizontal: 8 }} textStyle={{ color: getStatusColor(order.status), fontWeight: 'bold' }}>
                                            {order.status}
                                        </Chip>
                                        <Chip style={{ backgroundColor: order.payment_status ? '#D1FAE5' : '#FEF3C7' }} textStyle={{ color: order.payment_status ? '#059669' : '#B45309', fontWeight: 'bold' }}>
                                            {order.payment_status ? 'Paid' : 'Unpaid'}
                                        </Chip>
                                    </View>
                                    
                                    <View style={styles.itemsList}>
                                        <Text style={[styles.detailText, { marginBottom: 4, fontWeight: 'bold' }]}>Order Items:</Text>
                                        {order.order_type === 'CUSTOM' && order.custom_details ? (
                                            <View>
                                                <Text style={styles.itemRow}>• Item: {order.custom_details.item_wanted}</Text>
                                                <Text style={styles.itemRow}>• Quantity: {order.custom_details.quantity}</Text>
                                                <Text style={styles.itemRow}>• Delivery: {new Date(order.custom_details.delivery_date).toLocaleString()}</Text>
                                                <Text style={styles.itemRow}>• Customer: {order.custom_details.customer_name} {order.custom_details.customer_phone ? `(${order.custom_details.customer_phone})` : ''}</Text>
                                            </View>
                                        ) : (order.items || []).length === 0 ? (
                                            <Text style={styles.itemRow}>No items attached to this order.</Text>
                                        ) : (
                                            (order.items || []).map((item, idx) => (
                                                <Text key={idx} style={styles.itemRow}>• {item.quantity}x {item.product_name}</Text>
                                            ))
                                        )}
                                    </View>

                                    <View style={styles.actions}>
                                        {order.status === 'PENDING' && (
                                            <Button mode="contained" buttonColor="#3B82F6" onPress={() => updateOrderStatus(order.id, 'PREPARING')}>Send to Kitchen</Button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <Button mode="contained" buttonColor="#10B981" onPress={() => updateOrderStatus(order.id, 'READY')}>Mark Ready</Button>
                                        )}
                                        {order.status === 'READY' && (
                                            <Button 
                                                mode="contained" 
                                                buttonColor="#10B981" 
                                                icon="check-decagram"
                                                onPress={async () => {
                                                    try {
                                                        await client.post(`orders/orders/${order.id}/confirm-pickup/`);
                                                        fetchOrders();
                                                    } catch (e) {
                                                        console.error('Confirm pickup failed', e);
                                                        if (Platform.OS === 'web') alert("Failed to confirm handover.");
                                                    }
                                                }}
                                            >
                                                Confirm Handover to Customer
                                            </Button>
                                        )}
                                    </View>
                                </View>
                            </List.Accordion>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { width: '31%', backgroundColor: '#FFFFFF', elevation: 2, borderRadius: 12 },
    count: { fontSize: 32, fontWeight: '900', marginTop: 4 },
    sectionTitle: { marginBottom: 12, fontWeight: 'bold', fontSize: 18, color: '#1E293B' },
    empty: { textAlign: 'center', marginTop: 20, color: '#94A3B8', fontSize: 16 },
    accordion: { backgroundColor: '#FFFFFF', borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, elevation: 1 },
    iconBox: { justifyContent: 'center', marginLeft: 8 },
    orderTitle: { fontWeight: '700', color: '#0F172A' },
    detailsBox: { backgroundColor: '#F1F5F9', padding: 16, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    detailText: { color: '#475569', fontSize: 14 },
    itemsList: { marginBottom: 16, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8 },
    itemRow: { color: '#1E293B', fontSize: 14, marginBottom: 4 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }
});

export default OrderManagementScreen;
