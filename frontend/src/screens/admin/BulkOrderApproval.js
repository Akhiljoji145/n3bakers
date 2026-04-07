import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Button, Chip, Icon, Divider, Surface } from 'react-native-paper';
import client from '../../api/client';

const BulkOrderApproval = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => { fetchBulkOrders(); }, []);

    const fetchBulkOrders = async () => {
        setLoading(true);
        try {
            const res = await client.get('orders/orders/');
            // Filter only bulk orders
            setOrders(res.data.filter(o => o.order_type === 'BULK'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const approveOrder = async (orderId) => {
        setActionLoading(prev => ({ ...prev, [orderId]: 'approve' }));
        try {
            await client.patch(`orders/orders/${orderId}/`, { status: 'PREPARING', payment_status: true });
            fetchBulkOrders();
        } catch (e) {
            console.error(e);
            if (Platform.OS === 'web') alert('Failed to approve order.');
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: null }));
        }
    };

    const rejectOrder = async (orderId) => {
        setActionLoading(prev => ({ ...prev, [orderId]: 'reject' }));
        try {
            await client.patch(`orders/orders/${orderId}/`, { status: 'CANCELLED' });
            fetchBulkOrders();
        } catch (e) {
            console.error(e);
            if (Platform.OS === 'web') alert('Failed to reject order.');
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: null }));
        }
    };

    const pending = orders.filter(o => o.status === 'PENDING');
    const others = orders.filter(o => o.status !== 'PENDING');

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#E9C46A" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* KPI Header */}
                    <View style={styles.kpiRow}>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]} elevation={2}>
                            <Icon source="clock-outline" color="#D97706" size={28} />
                            <Text style={[styles.kpiVal, { color: '#D97706' }]}>{pending.length}</Text>
                            <Text style={styles.kpiLabel}>Awaiting Approval</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#D1FAE5' }]} elevation={2}>
                            <Icon source="check-circle" color="#059669" size={28} />
                            <Text style={[styles.kpiVal, { color: '#059669' }]}>
                                {orders.filter(o => o.status === 'PREPARING' || o.status === 'READY' || o.status === 'DELIVERED').length}
                            </Text>
                            <Text style={styles.kpiLabel}>Approved</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#FEE2E2' }]} elevation={2}>
                            <Icon source="close-circle" color="#DC2626" size={28} />
                            <Text style={[styles.kpiVal, { color: '#DC2626' }]}>
                                {orders.filter(o => o.status === 'CANCELLED').length}
                            </Text>
                            <Text style={styles.kpiLabel}>Rejected</Text>
                        </Surface>
                    </View>

                    {pending.length > 0 && (
                        <>
                            <Title style={styles.sectionTitle}>⏳ Pending Approval ({pending.length})</Title>
                            {pending.map(order => (
                                <Card key={order.id} style={[styles.orderCard, styles.pendingBorder]}>
                                    <Card.Content>
                                        <View style={styles.headerRow}>
                                            <View>
                                                <Text style={styles.orderId}>Bulk Order #{order.id}</Text>
                                                <Text style={styles.branchText}>{order.branch_name || `Branch #${order.branch}`}</Text>
                                                <Text style={styles.dateText}>{new Date(order.created_at).toLocaleString()}</Text>
                                            </View>
                                            <Text style={styles.amount}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                                        </View>
                                        {order.bulk_details && (
                                            <Surface style={styles.detailsBox} elevation={0}>
                                                <View style={styles.detailRow}>
                                                    <Icon source="calendar" size={16} color="#64748B" />
                                                    <Text style={styles.detailText}>
                                                        Scheduled: {new Date(order.bulk_details.schedule_date).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                                {order.bulk_details.notes ? (
                                                    <View style={styles.detailRow}>
                                                        <Icon source="note-text" size={16} color="#64748B" />
                                                        <Text style={styles.detailText}>{order.bulk_details.notes}</Text>
                                                    </View>
                                                ) : null}
                                            </Surface>
                                        )}
                                        <Text style={styles.itemsLabel}>{order.items.length} item(s) ordered</Text>
                                        <Divider style={{ marginVertical: 12 }} />
                                        <View style={styles.actionRow}>
                                            <Button
                                                mode="contained"
                                                buttonColor="#10B981"
                                                style={styles.actionBtn}
                                                loading={actionLoading[order.id] === 'approve'}
                                                onPress={() => approveOrder(order.id)}
                                            >Approve & Send to Kitchen</Button>
                                            <Button
                                                mode="outlined"
                                                textColor="#EF4444"
                                                style={[styles.actionBtn, styles.rejectBtn]}
                                                loading={actionLoading[order.id] === 'reject'}
                                                onPress={() => rejectOrder(order.id)}
                                            >Reject</Button>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </>
                    )}

                    {pending.length === 0 && (
                        <Surface style={styles.clearBox} elevation={1}>
                            <Icon source="check-all" color="#10B981" size={40} />
                            <Text style={styles.clearText}>All bulk orders have been reviewed!</Text>
                        </Surface>
                    )}

                    {others.length > 0 && (
                        <>
                            <Title style={styles.sectionTitle}>Order History</Title>
                            {others.map(order => {
                                const isApproved = order.status !== 'CANCELLED';
                                return (
                                    <Card key={order.id} style={[styles.orderCard, { borderLeftColor: isApproved ? '#10B981' : '#EF4444' }]}>
                                        <Card.Content style={styles.historyRow}>
                                            <View>
                                                <Text style={styles.orderId}>Bulk Order #{order.id}</Text>
                                                <Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString()}</Text>
                                            </View>
                                            <View style={styles.rightCol}>
                                                <Chip
                                                    style={{ backgroundColor: isApproved ? '#D1FAE5' : '#FEE2E2' }}
                                                    textStyle={{ color: isApproved ? '#059669' : '#DC2626', fontWeight: 'bold', fontSize: 11 }}
                                                >{order.status}</Chip>
                                                <Text style={styles.amount}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                );
                            })}
                        </>
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
    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    kpiCard: { width: '31%', padding: 14, borderRadius: 14, alignItems: 'center' },
    kpiVal: { fontSize: 28, fontWeight: '900', marginTop: 8 },
    kpiLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 4 },
    pendingBorder: { borderLeftColor: '#F59E0B' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    orderId: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    branchText: { fontSize: 13, color: '#3B82F6', marginTop: 2 },
    dateText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    amount: { fontSize: 20, fontWeight: '900', color: '#D97706' },
    detailsBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 10 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    detailText: { fontSize: 13, color: '#475569', flex: 1 },
    itemsLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
    actionBtn: { flex: 1, borderRadius: 8 },
    rejectBtn: { borderColor: '#EF4444' },
    clearBox: { backgroundColor: '#F0FDF4', padding: 32, borderRadius: 16, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    clearText: { fontSize: 16, color: '#059669', fontWeight: '600', marginTop: 12 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rightCol: { alignItems: 'flex-end', gap: 6 },
});

export default BulkOrderApproval;
