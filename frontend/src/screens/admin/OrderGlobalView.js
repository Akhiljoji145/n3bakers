import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Chip, Button, Surface, List, Divider } from 'react-native-paper';
import client from '../../api/client';

const { width } = Dimensions.get('window');

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

const STATUS_META = {
    PENDING: { color: '#F59E0B', bg: '#FEF3C7' },
    PREPARING: { color: '#3B82F6', bg: '#DBEAFE' },
    READY: { color: '#10B981', bg: '#D1FAE5' },
    DELIVERED: { color: '#64748B', bg: '#F1F5F9' },
    CANCELLED: { color: '#EF4444', bg: '#FEE2E2' },
};

const OrderGlobalView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await client.get('orders/orders/');
            setOrders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#E76F51" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* KPI Row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
                        {Object.entries(STATUS_META).map(([status, meta]) => (
                            <Surface key={status} style={[styles.kpiCard, { backgroundColor: meta.bg }]} elevation={2}>
                                <Text style={[styles.kpiValue, { color: meta.color }]}>
                                    {orders.filter(o => o.status === status).length}
                                </Text>
                                <Text style={[styles.kpiLabel, { color: meta.color }]}>{status}</Text>
                            </Surface>
                        ))}
                    </ScrollView>

                    {/* Filter Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {STATUS_OPTIONS.map(s => (
                            <Chip
                                key={s}
                                selected={filter === s}
                                onPress={() => setFilter(s)}
                                style={[styles.chip, filter === s && { backgroundColor: '#FDDCCA' }]}
                                textStyle={filter === s ? { color: '#E76F51', fontWeight: 'bold' } : { color: '#64748B' }}
                            >{s}</Chip>
                        ))}
                        <Button icon="refresh" mode="text" onPress={fetchOrders} textColor="#E76F51">Refresh</Button>
                    </ScrollView>

                    <Title style={styles.sectionTitle}>
                        {filteredOrders.length} {filter === 'ALL' ? 'Total' : filter} Orders
                    </Title>

                    {filteredOrders.length === 0 ? (
                        <Text style={styles.empty}>No orders matching this filter.</Text>
                    ) : (
                        filteredOrders.map(order => {
                            const meta = STATUS_META[order.status] || { color: '#64748B', bg: '#F1F5F9' };
                            return (
                                <Card key={order.id} style={[styles.orderCard, { borderLeftColor: meta.color }]}>
                                    <Card.Content style={styles.cardBody}>
                                        <View style={styles.orderRow}>
                                            <View>
                                                <Text style={styles.orderId}>Order #{order.id}</Text>
                                                <Text style={styles.orderBranch}>{order.branch_name || `Branch #${order.branch}`}</Text>
                                                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</Text>
                                            </View>
                                            <View style={styles.orderRight}>
                                                <Chip style={{ backgroundColor: meta.bg }} textStyle={{ color: meta.color, fontWeight: 'bold', fontSize: 11 }}>
                                                    {order.status}
                                                </Chip>
                                                <Chip style={styles.typeChip} textStyle={styles.typeText}>{order.order_type}</Chip>
                                            </View>
                                        </View>
                                        <Divider style={{ marginVertical: 8 }} />
                                        <View style={styles.itemsRow}>
                                            <Text style={styles.itemsText}>
                                                {order.items.length} item(s) — ₹{parseFloat(order.total_amount).toFixed(2)}
                                            </Text>
                                            <Chip
                                                icon={order.payment_status ? 'check-circle' : 'clock'}
                                                style={{ backgroundColor: order.payment_status ? '#D1FAE5' : '#FEF3C7' }}
                                                textStyle={{ color: order.payment_status ? '#059669' : '#B45309', fontSize: 11 }}
                                            >
                                                {order.payment_status ? 'Paid' : 'Unpaid'}
                                            </Chip>
                                        </View>
                                    </Card.Content>
                                </Card>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, marginTop: 80 },
    scroll: { padding: 16, paddingBottom: 40 },
    kpiScroll: { marginBottom: 16 },
    kpiCard: { padding: 16, borderRadius: 14, marginRight: 12, minWidth: 100, alignItems: 'center' },
    kpiValue: { fontSize: 28, fontWeight: '900' },
    kpiLabel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
    filterScroll: { marginBottom: 16 },
    chip: { marginRight: 8, backgroundColor: '#E2E8F0' },
    sectionTitle: { fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
    empty: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontSize: 15 },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 4 },
    cardBody: { padding: 16 },
    orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    orderBranch: { fontSize: 13, color: '#3B82F6', marginTop: 2 },
    orderDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    orderRight: { alignItems: 'flex-end', gap: 6 },
    typeChip: { backgroundColor: '#EDE9FE', marginTop: 4 },
    typeText: { color: '#7C3AED', fontSize: 11 },
    itemsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemsText: { fontSize: 13, color: '#475569', fontWeight: '600' },
});

export default OrderGlobalView;
