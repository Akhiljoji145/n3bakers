import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Chip, Icon, Surface, Divider, Button } from 'react-native-paper';
import client from '../../api/client';

const STEP_FLOW = ['PENDING', 'PREPARING', 'READY', 'DELIVERED'];

const DeliveryMonitoring = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await client.get('orders/orders/');
            setOrders(res.data.filter(o => o.status !== 'CANCELLED'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStepIndex = (status) => STEP_FLOW.indexOf(status);

    const countByStatus = (status) => orders.filter(o => o.status === status).length;

    const deliveredRecently = orders.filter(o => o.status === 'DELIVERED').slice(0, 10);
    const inProgress = orders.filter(o => o.status !== 'DELIVERED');

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#264653" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Pipeline Summary */}
                    <Title style={styles.pageTitle}>Delivery Pipeline Overview</Title>
                    <View style={styles.pipelineRow}>
                        {STEP_FLOW.map((step, idx) => (
                            <View key={step} style={styles.pipelineStep}>
                                <Surface style={[styles.stepBubble, { backgroundColor: idx < 3 ? '#EFF6FF' : '#D1FAE5' }]} elevation={1}>
                                    <Text style={[styles.stepCount, { color: idx < 3 ? '#2563EB' : '#059669' }]}>
                                        {countByStatus(step)}
                                    </Text>
                                </Surface>
                                {idx < STEP_FLOW.length - 1 && <Icon source="arrow-right" color="#CBD5E1" size={20} />}
                                <Text style={styles.stepLabel}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Live Orders */}
                    <Title style={styles.sectionTitle}>🚚  In-Progress Orders ({inProgress.length})</Title>
                    {inProgress.length === 0 ? (
                        <Text style={styles.empty}>No active deliveries right now.</Text>
                    ) : (
                        inProgress.map(order => {
                            const stepIdx = getStepIndex(order.status);
                            return (
                                <Card key={order.id} style={styles.orderCard}>
                                    <Card.Content>
                                        <View style={styles.cardTopRow}>
                                            <View>
                                                <Text style={styles.orderId}>Order #{order.id} — {order.order_type}</Text>
                                                <Text style={styles.branchText}>{order.branch_name || `Branch #${order.branch}`}</Text>
                                            </View>
                                            <Text style={styles.amount}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                                        </View>
                                        {/* Step Progress */}
                                        <View style={styles.stepTrack}>
                                            {STEP_FLOW.map((step, idx) => (
                                                <View key={step} style={styles.trackStep}>
                                                    <View style={[
                                                        styles.trackDot,
                                                        idx <= stepIdx ? styles.trackDotActive : styles.trackDotInactive
                                                    ]}>
                                                        {idx < stepIdx && <Icon source="check" color="#FFFFFF" size={12} />}
                                                        {idx === stepIdx && <View style={styles.trackDotCurrent} />}
                                                    </View>
                                                    <Text style={[styles.trackLabel, idx === stepIdx && { color: '#264653', fontWeight: 'bold' }]}>
                                                        {step}
                                                    </Text>
                                                    {idx < STEP_FLOW.length - 1 && (
                                                        <View style={[styles.trackLine, idx < stepIdx && styles.trackLineActive]} />
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </Card.Content>
                                </Card>
                            );
                        })
                    )}

                    {/* Recent Completed Deliveries */}
                    {deliveredRecently.length > 0 && (
                        <>
                            <Title style={styles.sectionTitle}>✅ Recently Completed</Title>
                            {deliveredRecently.map(order => (
                                <Card key={order.id} style={[styles.orderCard, { borderLeftColor: '#10B981' }]}>
                                    <Card.Content style={styles.completedRow}>
                                        <Icon source="check-circle" color="#10B981" size={24} />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={styles.orderId}>Order #{order.id}</Text>
                                            <Text style={styles.branchText}>{order.branch_name || `Branch #${order.branch}`}</Text>
                                        </View>
                                        <Text style={styles.amount}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
                                    </Card.Content>
                                </Card>
                            ))}
                        </>
                    )}

                    <Button icon="refresh" mode="outlined" onPress={fetchOrders} style={{ marginTop: 16 }} textColor="#264653">
                        Refresh Deliveries
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
    pipelineRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24, alignItems: 'flex-start' },
    pipelineStep: { alignItems: 'center', flex: 1 },
    stepBubble: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    stepCount: { fontSize: 22, fontWeight: '900' },
    stepLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
    empty: { textAlign: 'center', color: '#94A3B8', marginTop: 20 },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 3, borderLeftColor: '#264653' },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    orderId: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    branchText: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
    amount: { fontSize: 18, fontWeight: '800', color: '#264653' },
    stepTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    trackStep: { alignItems: 'center', flex: 1, position: 'relative' },
    trackDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    trackDotActive: { backgroundColor: '#264653' },
    trackDotInactive: { backgroundColor: '#CBD5E1' },
    trackDotCurrent: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
    trackLabel: { fontSize: 9, color: '#94A3B8', textAlign: 'center' },
    trackLine: { position: 'absolute', top: 12, left: '60%', right: '-60%', height: 2, backgroundColor: '#CBD5E1', zIndex: -1 },
    trackLineActive: { backgroundColor: '#264653' },
    completedRow: { flexDirection: 'row', alignItems: 'center' },
});

export default DeliveryMonitoring;
