import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface, Chip, Button, Divider } from 'react-native-paper';
import client from '../../api/client';

const PaymentMonitoring = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const paid = orders.filter(o => o.payment_status === true);
    const unpaid = orders.filter(o => o.payment_status === false);
    const totalRevenue = paid.reduce((s, o) => s + parseFloat(o.total_amount), 0);
    const totalPending = unpaid.reduce((s, o) => s + parseFloat(o.total_amount), 0);

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#FCA311" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Title style={styles.pageTitle}>Payment Overview</Title>

                    {/* KPI Cards */}
                    <View style={styles.kpiRow}>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#ECFDF5' }]} elevation={2}>
                            <Icon source="currency-inr" color="#059669" size={28} />
                            <Text style={[styles.kpiValue, { color: '#059669' }]}>₹{totalRevenue.toFixed(0)}</Text>
                            <Text style={styles.kpiLabel}>Total Collected</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]} elevation={2}>
                            <Icon source="clock-alert" color="#D97706" size={28} />
                            <Text style={[styles.kpiValue, { color: '#D97706' }]}>₹{totalPending.toFixed(0)}</Text>
                            <Text style={styles.kpiLabel}>Pending Collection</Text>
                        </Surface>
                    </View>

                    <View style={styles.kpiRow}>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#EFF6FF' }]} elevation={2}>
                            <Icon source="receipt" color="#2563EB" size={28} />
                            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{paid.length}</Text>
                            <Text style={styles.kpiLabel}>Paid Orders</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#FFF7ED' }]} elevation={2}>
                            <Icon source="alert-circle" color="#EA580C" size={28} />
                            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{unpaid.length}</Text>
                            <Text style={styles.kpiLabel}>Unpaid Orders</Text>
                        </Surface>
                    </View>

                    {/* Unpaid Orders - Priority List */}
                    {unpaid.length > 0 && (
                        <>
                            <Title style={styles.sectionTitle}>⚠️ Unpaid Orders ({unpaid.length})</Title>
                            {unpaid.map(order => (
                                <Card key={order.id} style={[styles.orderCard, { borderLeftColor: '#F59E0B' }]}>
                                    <Card.Content style={styles.cardRow}>
                                        <View>
                                            <Text style={styles.orderId}>Order #{order.id}</Text>
                                            <Text style={styles.orderMeta}>{order.order_type} | {order.branch_name || `Branch #${order.branch}`}</Text>
                                            <Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString()}</Text>
                                        </View>
                                        <View style={styles.rightCol}>
                                            <Text style={[styles.amount, { color: '#D97706' }]}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                                            <Chip style={{ backgroundColor: '#FEF3C7', marginTop: 4 }} textStyle={{ color: '#B45309', fontSize: 10, fontWeight: 'bold' }}>
                                                {order.status}
                                            </Chip>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </>
                    )}

                    {/* Paid Orders */}
                    <Title style={styles.sectionTitle}>✅ Paid Transactions ({paid.length})</Title>
                    {paid.length === 0 ? (
                        <Text style={styles.empty}>No paid orders yet.</Text>
                    ) : (
                        paid.slice(0, 20).map(order => (
                            <Card key={order.id} style={[styles.orderCard, { borderLeftColor: '#10B981' }]}>
                                <Card.Content style={styles.cardRow}>
                                    <View>
                                        <Text style={styles.orderId}>Order #{order.id}</Text>
                                        <Text style={styles.orderMeta}>{order.order_type} | {order.branch_name || `Branch #${order.branch}`}</Text>
                                        <Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.rightCol}>
                                        <Text style={[styles.amount, { color: '#059669' }]}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                                        <Chip style={{ backgroundColor: '#D1FAE5', marginTop: 4 }} textStyle={{ color: '#047857', fontSize: 10, fontWeight: 'bold' }}>
                                            PAID
                                        </Chip>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}

                    <Button icon="refresh" mode="outlined" onPress={fetchOrders} style={{ marginTop: 16 }} textColor="#FCA311">
                        Refresh Payments
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
    pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    kpiCard: { width: '48%', padding: 16, borderRadius: 14, alignItems: 'center' },
    kpiValue: { fontSize: 26, fontWeight: '900', marginTop: 8 },
    kpiLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 16, marginBottom: 10 },
    empty: { textAlign: 'center', color: '#94A3B8', marginBottom: 10 },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 8, elevation: 1, borderLeftWidth: 4 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    orderMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
    dateText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    amount: { fontSize: 18, fontWeight: '900' },
    rightCol: { alignItems: 'flex-end' },
});

export default PaymentMonitoring;
