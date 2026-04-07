import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface, Divider } from 'react-native-paper';
import client from '../../api/client';

const ManagerReportsScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await client.get('orders/orders/');
            // Backend should return ONLY this branch's orders based on Manager's branch ID.
            setOrders(response.data);
        } catch (e) {
            console.error('Fetch reports error', e);
        } finally {
            setLoading(false);
        }
    };

    // Derived statistics
    const completedOrders = orders.filter(o => o.status === 'DELIVERED');
    const todayRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const averageOrderValue = completedOrders.length > 0 ? (todayRevenue / completedOrders.length) : 0;
    
    // Top Items Calculation
    const itemMap = {};
    completedOrders.forEach(order => {
        order.items.forEach(item => {
            if (!itemMap[item.product]) {
                itemMap[item.product] = { id: item.product, count: 0, revenue: 0 };
            }
            itemMap[item.product].count += item.quantity;
            itemMap[item.product].revenue += (parseFloat(item.price_at_order) * item.quantity);
        });
    });
    
    // Sort items by count
    const topItems = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#D2691E" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Title style={styles.pageTitle}>End of Day Summary</Title>
                    <Text style={styles.subText}>Key Performance Indicators for your branch.</Text>

                    <View style={styles.heroGrid}>
                        <Surface style={[styles.heroCard, { backgroundColor: '#FFF7ED' }]} elevation={2}>
                            <Icon source="currency-usd" color="#D2691E" size={32} />
                            <Text style={styles.heroValue}>₹{todayRevenue.toFixed(2)}</Text>
                            <Text style={styles.heroLabel}>Total Revenue</Text>
                        </Surface>
                        
                        <Surface style={[styles.heroCard, { backgroundColor: '#EFF6FF' }]} elevation={2}>
                            <Icon source="clipboard-check-outline" color="#3B82F6" size={32} />
                            <Text style={styles.heroValue}>{completedOrders.length}</Text>
                            <Text style={styles.heroLabel}>Orders Fulfilled</Text>
                        </Surface>
                        
                        <Surface style={[styles.heroCard, { backgroundColor: '#F0FDF4' }]} elevation={2}>
                            <Icon source="chart-line" color="#10B981" size={32} />
                            <Text style={styles.heroValue}>₹{averageOrderValue.toFixed(2)}</Text>
                            <Text style={styles.heroLabel}>Average Bill</Text>
                        </Surface>
                    </View>

                    <Title style={styles.sectionTitle}>Top Selling Items</Title>
                    <Card style={styles.listCard}>
                        <Card.Content style={{ padding: 0 }}>
                            {topItems.length === 0 ? (
                                <Text style={styles.empty}>No sales data available yet.</Text>
                            ) : (
                                topItems.map((item, index) => (
                                    <View key={item.id}>
                                        <View style={styles.listItem}>
                                            <View style={styles.rankBadge}>
                                                <Text style={styles.rankText}>#{index + 1}</Text>
                                            </View>
                                            <View style={styles.itemDetails}>
                                                <Text style={styles.itemName}>Product ID#{item.id}</Text>
                                                <Text style={styles.itemSub}>Revenue generated: ₹{item.revenue.toFixed(2)}</Text>
                                            </View>
                                            <Text style={styles.itemCount}>{item.count} Sold</Text>
                                        </View>
                                        {index < topItems.length - 1 && <Divider />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 40 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    subText: { fontSize: 14, color: '#64748B', marginBottom: 20 },
    heroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    heroCard: { width: '31%', padding: 16, borderRadius: 16, alignItems: 'center' },
    heroValue: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginTop: 12, marginBottom: 4 },
    heroLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
    listCard: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', elevation: 2 },
    empty: { padding: 20, textAlign: 'center', color: '#94A3B8' },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    rankBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    rankText: { fontWeight: 'bold', color: '#475569' },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
    itemSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
    itemCount: { fontSize: 16, fontWeight: 'bold', color: '#10B981' }
});

export default ManagerReportsScreen;
