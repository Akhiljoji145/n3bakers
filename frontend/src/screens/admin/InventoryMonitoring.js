import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface, Divider, Button, Chip } from 'react-native-paper';
import client from '../../api/client';

const { width } = Dimensions.get('window');
const isWide = width > 768;

const InventoryMonitoring = () => {
    const [inventory, setInventory] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL | LOW

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, ingRes] = await Promise.all([
                client.get('inventory/branch-inventory/'),
                client.get('inventory/ingredients/'),
            ]);
            setInventory(invRes.data);
            setIngredients(ingRes.data);
        } catch (e) {
            console.error('Inventory fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const getIngredientName = (id) => {
        const ing = ingredients.find(i => i.id === id);
        return ing ? `${ing.name} (${ing.unit})` : `Ingredient #${id}`;
    };

    const getLowStockPercent = (qty, threshold) => {
        if (parseFloat(threshold) === 0) return 100;
        return Math.min(100, Math.round((parseFloat(qty) / parseFloat(threshold)) * 100));
    };

    const filteredInventory = filter === 'LOW'
        ? inventory.filter(i => parseFloat(i.quantity) <= parseFloat(i.low_stock_threshold))
        : inventory;

    const lowStockCount = inventory.filter(i => parseFloat(i.quantity) <= parseFloat(i.low_stock_threshold)).length;

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#2A9D8F" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* KPI Row */}
                    <View style={styles.kpiRow}>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#F0FDF4' }]} elevation={2}>
                            <Icon source="package-variant" color="#16A34A" size={28} />
                            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{inventory.length}</Text>
                            <Text style={styles.kpiLabel}>Total Items</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#FEF2F2' }]} elevation={2}>
                            <Icon source="alert-circle" color="#DC2626" size={28} />
                            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{lowStockCount}</Text>
                            <Text style={styles.kpiLabel}>Low Stock</Text>
                        </Surface>
                        <Surface style={[styles.kpiCard, { backgroundColor: '#EFF6FF' }]} elevation={2}>
                            <Icon source="check-all" color="#2563EB" size={28} />
                            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{inventory.length - lowStockCount}</Text>
                            <Text style={styles.kpiLabel}>Healthy Stock</Text>
                        </Surface>
                    </View>

                    {/* Filter */}
                    <View style={styles.filterRow}>
                        <Chip
                            selected={filter === 'ALL'}
                            onPress={() => setFilter('ALL')}
                            style={[styles.chip, filter === 'ALL' && styles.chipActive]}
                            textStyle={filter === 'ALL' ? styles.chipTextActive : styles.chipText}
                        >All Items</Chip>
                        <Chip
                            selected={filter === 'LOW'}
                            onPress={() => setFilter('LOW')}
                            style={[styles.chip, filter === 'LOW' && { backgroundColor: '#FEE2E2' }]}
                            textStyle={filter === 'LOW' ? { color: '#DC2626', fontWeight: 'bold' } : styles.chipText}
                            icon="alert"
                        >Low Stock Only</Chip>
                        <Button icon="refresh" mode="text" onPress={fetchData} textColor="#2A9D8F">Refresh</Button>
                    </View>

                    {filteredInventory.length === 0 ? (
                        <Text style={styles.empty}>{filter === 'LOW' ? '✅ All ingredients are sufficiently stocked!' : 'No inventory records found.'}</Text>
                    ) : (
                        <View style={styles.grid}>
                            {filteredInventory.map(item => {
                                const isLow = parseFloat(item.quantity) <= parseFloat(item.low_stock_threshold);
                                const name = getIngredientName(item.ingredient);
                                const pct = getLowStockPercent(item.quantity, item.low_stock_threshold);
                                return (
                                    <Card key={item.id} style={[styles.itemCard, isLow && styles.lowCard]}>
                                        <View style={[styles.cardBanner, { backgroundColor: isLow ? '#EF444420' : '#10B98120' }]}>
                                            <Icon source={isLow ? 'alert' : 'check-circle'} color={isLow ? '#EF4444' : '#10B981'} size={18} />
                                            <Text style={[styles.bannerText, { color: isLow ? '#EF4444' : '#10B981' }]}>
                                                {isLow ? 'LOW STOCK' : 'IN STOCK'}
                                            </Text>
                                        </View>
                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.ingredientName} numberOfLines={2}>{name}</Text>
                                            <Text style={styles.branchLabel}>Branch #{item.branch}</Text>
                                            <View style={styles.qtyRow}>
                                                <Text style={[styles.qtyNum, { color: isLow ? '#DC2626' : '#059669' }]}>
                                                    {parseFloat(item.quantity).toFixed(1)}
                                                </Text>
                                                <Text style={styles.qtyThreshold}> / {item.low_stock_threshold} (min)</Text>
                                            </View>
                                            {/* Progress Bar */}
                                            <View style={styles.progressBg}>
                                                <View style={[styles.progressFill, {
                                                    width: `${Math.min(pct, 100)}%`,
                                                    backgroundColor: isLow ? '#EF4444' : '#10B981'
                                                }]} />
                                            </View>
                                        </Card.Content>
                                    </Card>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    loader: { flex: 1, marginTop: 80 },
    scroll: { padding: 16, paddingBottom: 40 },
    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    kpiCard: { width: '31%', padding: 16, borderRadius: 16, alignItems: 'center' },
    kpiValue: { fontSize: 28, fontWeight: '900', marginTop: 8 },
    kpiLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '600' },
    filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: '#E2E8F0' },
    chipActive: { backgroundColor: '#CCFBF1' },
    chipText: { color: '#475569' },
    chipTextActive: { color: '#0F766E', fontWeight: 'bold' },
    empty: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    itemCard: { width: isWide ? '31%' : '48%', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, elevation: 2, overflow: 'hidden' },
    lowCard: { borderWidth: 1, borderColor: '#FECACA' },
    cardBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8 },
    bannerText: { fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
    cardContent: { padding: 12 },
    ingredientName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    branchLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
    qtyRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
    qtyNum: { fontSize: 26, fontWeight: '900' },
    qtyThreshold: { fontSize: 12, color: '#94A3B8' },
    progressBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
    progressFill: { height: 6, borderRadius: 3 },
});

export default InventoryMonitoring;
