import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Card, Title, Text, Button, List, ActivityIndicator, Chip, Icon } from 'react-native-paper';
import client from '../../api/client';

const OrderManagementScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await client.get('orders/orders/');
            // Optionally filter on frontend if backend doesn't filter perfectly yet
            setOrders(response.data.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.payment_status === true));
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
                                description={`Type: ${order.order_type} | Placed: ${new Date(order.created_at).toLocaleTimeString()}`}
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
                                    </View>
                                    
                                    <View style={styles.itemsList}>
                                        <Text style={[styles.detailText, { marginBottom: 4, fontWeight: 'bold' }]}>Order Items:</Text>
                                        {order.items.map((item, idx) => (
                                            <Text key={idx} style={styles.itemRow}>• {item.quantity}x Custom Product ID#{item.product}</Text>
                                            // In a real app we expand the serializer to send product names, currently it's just the ID
                                        ))}
                                    </View>

                                    <View style={styles.actions}>
                                        {order.status === 'PENDING' && (
                                            <Button mode="contained" buttonColor="#3B82F6" onPress={() => updateOrderStatus(order.id, 'PREPARING')}>Send to Kitchen</Button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <Button mode="contained" buttonColor="#10B981" onPress={() => updateOrderStatus(order.id, 'READY')}>Mark Ready</Button>
                                        )}
                                        {order.status === 'READY' && (
                                            <Button mode="contained" buttonColor="#64748B" onPress={() => updateOrderStatus(order.id, 'DELIVERED')}>Mark Delivered / Handed Over</Button>
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
