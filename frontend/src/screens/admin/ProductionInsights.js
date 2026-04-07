import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface, Button, Divider } from 'react-native-paper';
import client from '../../api/client';

const ProductionInsights = () => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchPlan(); }, []);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const res = await client.get('analytics/production-plan/');
            setPlan(res.data);
        } catch (e) {
            console.error('Production plan fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const hasShortfall = plan && plan.shortfalls && plan.shortfalls.length > 0;
    const hasRequirements = plan && plan.requirements && Object.keys(plan.requirements).length > 0;

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#06D6A0" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Title style={styles.pageTitle}>Production Insights</Title>
                    <Text style={styles.subtitle}>AI-powered demand forecasting based on pending orders</Text>

                    {/* Status Banner */}
                    {plan && (
                        <Surface style={[
                            styles.statusBanner,
                            hasShortfall ? styles.bannerWarning : styles.bannerGood
                        ]} elevation={2}>
                            <Icon
                                source={hasShortfall ? 'alert-circle' : 'check-circle'}
                                color={hasShortfall ? '#D97706' : '#059669'}
                                size={32}
                            />
                            <View style={{ marginLeft: 16 }}>
                                <Text style={[styles.bannerTitle, { color: hasShortfall ? '#92400E' : '#064E3B' }]}>
                                    {hasShortfall ? 'Shortfalls Detected' : 'Production Ready'}
                                </Text>
                                <Text style={[styles.bannerSub, { color: hasShortfall ? '#B45309' : '#059669' }]}>
                                    {hasShortfall
                                        ? `${plan.shortfalls.length} ingredient(s) are insufficient for pending orders.`
                                        : 'Sufficient stock exists for all pending orders.'}
                                </Text>
                            </View>
                        </Surface>
                    )}

                    {/* Ingredient Requirements */}
                    {hasRequirements && (
                        <>
                            <Title style={styles.sectionTitle}>📦 Ingredient Requirements (per pending orders)</Title>
                            <Card style={styles.card}>
                                <Card.Content>
                                    {Object.entries(plan.requirements).map(([ingredient, needed], idx) => {
                                        const isShortfall = hasShortfall && plan.shortfalls.some(s => s.ingredient === ingredient || s.ingredient_name === ingredient);
                                        return (
                                            <View key={ingredient}>
                                                <View style={styles.reqRow}>
                                                    <Icon
                                                        source={isShortfall ? 'alert' : 'check'}
                                                        color={isShortfall ? '#EF4444' : '#10B981'}
                                                        size={20}
                                                    />
                                                    <Text style={[styles.reqName, isShortfall && { color: '#DC2626' }]}>
                                                        {ingredient}
                                                    </Text>
                                                    <Text style={[styles.reqAmount, isShortfall && { color: '#DC2626', fontWeight: 'bold' }]}>
                                                        {typeof needed === 'object' ? JSON.stringify(needed) : needed}
                                                    </Text>
                                                </View>
                                                {idx < Object.entries(plan.requirements).length - 1 && <Divider style={{ marginVertical: 6 }} />}
                                            </View>
                                        );
                                    })}
                                </Card.Content>
                            </Card>
                        </>
                    )}

                    {/* Shortfalls Detail */}
                    {hasShortfall && (
                        <>
                            <Title style={styles.sectionTitle}>🚨 Critical Shortfalls — Order Now</Title>
                            {plan.shortfalls.map((shortfall, idx) => (
                                <Card key={idx} style={[styles.card, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
                                    <Card.Content>
                                        <Text style={styles.shortfallName}>
                                            {shortfall.ingredient_name || shortfall.ingredient}
                                        </Text>
                                        <View style={styles.shortfallRow}>
                                            <View style={styles.shortfallItem}>
                                                <Text style={styles.shortfallLabel}>Required</Text>
                                                <Text style={[styles.shortfallVal, { color: '#EF4444' }]}>
                                                    {shortfall.required || shortfall.needed}
                                                </Text>
                                            </View>
                                            <Icon source="arrow-right" color="#CBD5E1" size={20} />
                                            <View style={styles.shortfallItem}>
                                                <Text style={styles.shortfallLabel}>Available</Text>
                                                <Text style={[styles.shortfallVal, { color: '#64748B' }]}>
                                                    {shortfall.available || shortfall.current}
                                                </Text>
                                            </View>
                                            <Icon source="arrow-right" color="#CBD5E1" size={20} />
                                            <View style={styles.shortfallItem}>
                                                <Text style={styles.shortfallLabel}>Deficit</Text>
                                                <Text style={[styles.shortfallVal, { color: '#DC2626', fontWeight: '900' }]}>
                                                    {shortfall.deficit || shortfall.shortage}
                                                </Text>
                                            </View>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </>
                    )}

                    {!plan && !loading && (
                        <Surface style={styles.emptyBox} elevation={1}>
                            <Icon source="chart-timeline-variant" color="#06D6A0" size={48} />
                            <Text style={styles.emptyText}>No production data available.</Text>
                            <Text style={styles.emptySub}>Add pending orders to see forecasted requirements.</Text>
                        </Surface>
                    )}

                    <Button icon="refresh" mode="outlined" onPress={fetchPlan} style={{ marginTop: 16 }} textColor="#06D6A0">
                        Recalculate Production Plan
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
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
    statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 20 },
    bannerGood: { backgroundColor: '#ECFDF5' },
    bannerWarning: { backgroundColor: '#FFFBEB' },
    bannerTitle: { fontSize: 16, fontWeight: 'bold' },
    bannerSub: { fontSize: 13, marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 14, elevation: 2 },
    reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reqName: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '600' },
    reqAmount: { fontSize: 14, color: '#475569' },
    shortfallName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
    shortfallRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    shortfallItem: { alignItems: 'center' },
    shortfallLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    shortfallVal: { fontSize: 18, fontWeight: '800', marginTop: 4 },
    emptyBox: { padding: 40, borderRadius: 16, alignItems: 'center', backgroundColor: '#F0FDFA', marginTop: 40 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#0F766E', marginTop: 16 },
    emptySub: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
});

export default ProductionInsights;
