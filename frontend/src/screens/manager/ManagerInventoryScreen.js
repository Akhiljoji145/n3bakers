import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface } from 'react-native-paper';
import client from '../../api/client';

const ManagerInventoryScreen = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await client.get('inventory/branch-inventory/');
            setInventory(response.data);
        } catch (e) {
            console.error('Fetch inventory error', e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBlock = (qty, threshold) => {
        if (parseFloat(qty) <= parseFloat(threshold)) {
            return { color: '#EF4444', text: 'LOW STOCK ALERT', icon: 'alert' };
        }
        return { color: '#10B981', text: 'IN STOCK', icon: 'check-circle' };
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#D2691E" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Surface style={styles.alertSurface} elevation={1}>
                        <Icon source="information" size={24} color="#3B82F6" />
                        <Text style={styles.alertText}>
                            Inventory is managed automatically by confirmed recipes or by the Admin. This is a read-only view to monitor local stock availability.
                        </Text>
                    </Surface>

                    <Title style={styles.sectionTitle}>Branch Stock Levels</Title>
                    
                    {inventory.length === 0 ? (
                        <Text style={styles.empty}>No inventory allocated to this branch yet.</Text>
                    ) : (
                        <View style={styles.grid}>
                            {inventory.map(item => {
                                const status = getStatusBlock(item.quantity, item.low_stock_threshold);
                                return (
                                    <Card key={item.id} style={styles.itemCard}>
                                        <View style={[styles.cardHeader, { backgroundColor: `${status.color}10` }]}>
                                            <Icon source={status.icon} color={status.color} size={20} />
                                            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                                        </View>
                                        <Card.Content style={styles.content}>
                                            <Text style={styles.ingredientName}>Ingredient #{item.ingredient}</Text>
                                            <View style={styles.qtyBox}>
                                                <Text style={styles.qtyValue}>{item.quantity}</Text>
                                            </View>
                                            <Text style={styles.subText}>Threshold: {item.low_stock_threshold}</Text>
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
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16 },
    alertSurface: { padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    alertText: { marginLeft: 12, color: '#1E3A8A', flex: 1, lineHeight: 20 },
    sectionTitle: { marginBottom: 16, fontWeight: 'bold', fontSize: 18, color: '#1E293B' },
    empty: { textAlign: 'center', color: '#94A3B8', marginTop: 30 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    itemCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, elevation: 2, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', padding: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    statusText: { marginLeft: 6, fontWeight: 'bold', fontSize: 12 },
    content: { padding: 16, alignItems: 'center' },
    ingredientName: { fontSize: 16, fontWeight: '600', color: '#334155', textAlign: 'center', marginBottom: 12 },
    qtyBox: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
    qtyValue: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
    subText: { fontSize: 12, color: '#94A3B8' }
});

export default ManagerInventoryScreen;
