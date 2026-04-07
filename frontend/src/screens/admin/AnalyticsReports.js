import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface, Divider, Button } from 'react-native-paper';
import client from '../../api/client';

const AnalyticsReports = () => {
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

    // Derived calculations
    const delivered = orders.filter(o => o.status === 'DELIVERED' && o.payment_status);
    const totalRevenue = delivered.reduce((s, o) => s + parseFloat(o.total_amount), 0);
    const avgOrder = delivered.length > 0 ? totalRevenue / delivered.length : 0;

    // Revenue by order type
    const byType = ['POS', 'ONLINE', 'BULK'].map(type => ({
        type,
        count: delivered.filter(o => o.order_type === type).length,
        revenue: delivered.filter(o => o.order_type === type).reduce((s, o) => s + parseFloat(o.total_amount), 0),
    }));

    // Revenue by branch
    const branchMap = {};
    delivered.forEach(o => {
        const key = o.branch_name || `Branch #${o.branch}`;
        if (!branchMap[key]) branchMap[key] = { name: key, count: 0, revenue: 0 };
        branchMap[key].count++;
        branchMap[key].revenue += parseFloat(o.total_amount);
    });
    const branchList = Object.values(branchMap).sort((a, b) => b.revenue - a.revenue);

    // Top products
    const productMap = {};
    delivered.forEach(o => o.items.forEach(item => {
        const key = item.product_name || `Product #${item.product}`;
        if (!productMap[key]) productMap[key] = { name: key, count: 0, revenue: 0 };
        productMap[key].count += item.quantity;
        productMap[key].revenue += parseFloat(item.price_at_order) * item.quantity;
    }));
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const TYPE_COLORS = { POS: '#8B5CF6', ONLINE: '#3B82F6', BULK: '#F59E0B' };
    const maxRevenue = branchList.length > 0 ? branchList[0].revenue : 1;

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#118AB2" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Title style={styles.pageTitle}>Analytics & Reports</Title>

                    {/* Top KPI Row */}
                    <View style={styles.kpiRow}>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#EFF6FF' }]} elevation={2}>
                            <Icon source="currency-inr" color="#2563EB" size={28} />
                            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>₹{totalRevenue.toFixed(0)}</Text>
                            <Text style={styles.kpiLabel}>Total Revenue</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#F0FDF4' }]} elevation={2}>
                            <Icon source="clipboard-check" color="#16A34A" size={28} />
                            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{delivered.length}</Text>
                            <Text style={styles.kpiLabel}>Completed Orders</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#FFF7ED' }]} elevation={2}>
                            <Icon source="calculator" color="#EA580C" size={28} />
                            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>₹{avgOrder.toFixed(0)}</Text>
                            <Text style={styles.kpiLabel}>Average Order</Text>
                        </Surface>
                    </View>

                    {/* Order Type Breakdown */}
                    <Title style={styles.sectionTitle}>Revenue by Order Type</Title>
                    <Card style={styles.card}>
                        <Card.Content>
                            {byType.map(item => (
                                <View key={item.type}>
                                    <View style={styles.typeRow}>
                                        <View style={[styles.typeDot, { backgroundColor: TYPE_COLORS[item.type] }]} />
                                        <Text style={styles.typeLabel}>{item.type}</Text>
                                        <View style={styles.barBg}>
                                            <View style={[styles.barFill, {
                                                width: totalRevenue > 0 ? `${(item.revenue / totalRevenue) * 100}%` : '0%',
                                                backgroundColor: TYPE_COLORS[item.type]
                                            }]} />
                                        </View>
                                        <Text style={styles.typeAmount}>₹{item.revenue.toFixed(0)}</Text>
                                        <Text style={styles.typeCount}>({item.count})</Text>
                                    </View>
                                    <Divider style={{ marginVertical: 8 }} />
                                </View>
                            ))}
                        </Card.Content>
                    </Card>

                    {/* Branch Performance */}
                    <Title style={styles.sectionTitle}>Top Branches by Revenue</Title>
                    <Card style={styles.card}>
                        <Card.Content>
                            {branchList.length === 0 ? (
                                <Text style={styles.empty}>No branch data yet.</Text>
                            ) : (
                                branchList.map((branch, idx) => (
                                    <View key={branch.name}>
                                        <View style={styles.branchRow}>
                                            <View style={styles.rankBadge}>
                                                <Text style={styles.rankText}>#{idx + 1}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.branchName}>{branch.name}</Text>
                                                <View style={styles.miniBarBg}>
                                                    <View style={[styles.miniBarFill, { width: `${(branch.revenue / maxRevenue) * 100}%` }]} />
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.branchRevenue}>₹{branch.revenue.toFixed(0)}</Text>
                                                <Text style={styles.branchCount}>{branch.count} orders</Text>
                                            </View>
                                        </View>
                                        {idx < branchList.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    {/* Top Products */}
                    <Title style={styles.sectionTitle}>🏆 Top Performing Products</Title>
                    <Card style={styles.card}>
                        <Card.Content>
                            {topProducts.length === 0 ? (
                                <Text style={styles.empty}>No product data yet.</Text>
                            ) : (
                                topProducts.map((product, idx) => (
                                    <View key={product.name}>
                                        <View style={styles.productRow}>
                                            <Text style={styles.medalText}>
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                            </Text>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.productName}>{product.name}</Text>
                                                <Text style={styles.productSold}>{product.count} units sold</Text>
                                            </View>
                                            <Text style={styles.productRevenue}>₹{product.revenue.toFixed(0)}</Text>
                                        </View>
                                        {idx < topProducts.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    <Button icon="refresh" mode="outlined" onPress={fetchOrders} style={{ marginTop: 16 }} textColor="#118AB2">
                        Refresh Analytics
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
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    kpiCard: { width: '31%', padding: 14, borderRadius: 14, alignItems: 'center' },
    kpiValue: { fontSize: 20, fontWeight: '900', marginTop: 8 },
    kpiLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, elevation: 2 },
    empty: { textAlign: 'center', color: '#94A3B8', paddingVertical: 12 },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeDot: { width: 12, height: 12, borderRadius: 6 },
    typeLabel: { width: 60, fontWeight: '600', color: '#1E293B' },
    barBg: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4 },
    barFill: { height: 8, borderRadius: 4 },
    typeAmount: { fontSize: 14, fontWeight: '700', color: '#0F172A', width: 80, textAlign: 'right' },
    typeCount: { fontSize: 12, color: '#94A3B8', width: 40 },
    branchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
    branchName: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
    miniBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3 },
    miniBarFill: { height: 6, backgroundColor: '#118AB2', borderRadius: 3 },
    branchRevenue: { fontSize: 15, fontWeight: '800', color: '#118AB2' },
    branchCount: { fontSize: 11, color: '#94A3B8' },
    productRow: { flexDirection: 'row', alignItems: 'center' },
    medalText: { fontSize: 22, width: 36 },
    productName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    productSold: { fontSize: 12, color: '#64748B', marginTop: 2 },
    productRevenue: { fontSize: 16, fontWeight: '800', color: '#118AB2' },
});

export default AnalyticsReports;
