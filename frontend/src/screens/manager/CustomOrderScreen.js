import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
    Card, TextInput, Button, Title, HelperText, Text,
    SegmentedButtons, Chip, Divider, Icon, ActivityIndicator
} from 'react-native-paper';
import client from '../../api/client';

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending'   },
    PREPARING: { color: '#3B82F6', bg: '#DBEAFE', label: 'Preparing' },
    READY:     { color: '#10B981', bg: '#D1FAE5', label: 'Ready'     },
    DELIVERED: { color: '#64748B', bg: '#F1F5F9', label: 'Delivered' },
    CANCELLED: { color: '#EF4444', bg: '#FEE2E2', label: 'Cancelled' },
};

const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const isOverdue = (isoDate, status) => {
    if (status === 'DELIVERED' || status === 'CANCELLED') return false;
    return new Date(isoDate) < new Date();
};

// ─── Tracking sub-component ──────────────────────────────────────────────────
const TrackingView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');

    const fetchOrders = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const res = await client.get('orders/orders/');
            const all = Array.isArray(res.data) ? res.data : [];
            setOrders(all.filter(o => o.order_type === 'CUSTOM'));
        } catch (e) {
            console.error('Fetch custom orders error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders({ silent: true });
    };

    const filtered = filter === 'ALL'
        ? orders
        : orders.filter(o => o.status === filter);

    const counts = Object.fromEntries(
        Object.keys(STATUS_CONFIG).map(s => [s, orders.filter(o => o.status === s).length])
    );

    if (loading) {
        return <ActivityIndicator size="large" color="#4D96FF" style={{ marginTop: 40 }} />;
    }

    return (
        <ScrollView
            contentContainerStyle={styles.trackScroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Summary chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {[['ALL', null], ...Object.entries(STATUS_CONFIG)].map(([key, cfg]) => {
                    const count = key === 'ALL' ? orders.length : counts[key];
                    const active = filter === key;
                    return (
                        <Chip
                            key={key}
                            selected={active}
                            onPress={() => setFilter(key)}
                            style={[
                                styles.filterChip,
                                active && { backgroundColor: cfg?.color ?? '#4D96FF' }
                            ]}
                            textStyle={[styles.filterChipText, active && { color: '#fff' }]}
                        >
                            {cfg?.label ?? 'All'} ({count})
                        </Chip>
                    );
                })}
            </ScrollView>

            {filtered.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Icon source="clipboard-off-outline" size={56} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No custom orders found.</Text>
                </View>
            ) : (
                filtered.map(order => {
                    const cd = order.custom_details;
                    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
                    const overdue = cd && isOverdue(cd.delivery_date, order.status);

                    return (
                        <Card key={order.id} style={[styles.orderCard, overdue && styles.overdueCard]}>
                            {/* Header row */}
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.orderId}>Order #{order.id}</Text>
                                    <Text style={styles.orderDate}>
                                        Placed: {fmt(order.created_at)}
                                    </Text>
                                </View>
                                <View style={styles.headerRight}>
                                    {overdue && (
                                        <Chip style={styles.overdueChip} textStyle={styles.overdueChipText}>
                                            ⚠ Overdue
                                        </Chip>
                                    )}
                                    <Chip
                                        style={[styles.statusChip, { backgroundColor: cfg.bg }]}
                                        textStyle={[styles.statusChipText, { color: cfg.color }]}
                                    >
                                        {cfg.label}
                                    </Chip>
                                </View>
                            </View>

                            <Divider style={{ marginVertical: 10 }} />

                            {cd ? (
                                <View style={styles.detailGrid}>
                                    <Row icon="account" label="Customer" value={`${cd.customer_name}${cd.customer_phone ? `  ·  ${cd.customer_phone}` : ''}`} />
                                    <Row icon="food-croissant" label="Item" value={cd.item_wanted} />
                                    <Row icon="numeric" label="Quantity" value={`${cd.quantity} units`} />
                                    <Row icon="currency-inr" label="Agreed Price" value={`₹${parseFloat(cd.price).toFixed(2)}`} />
                                    <Row
                                        icon="calendar-clock"
                                        label="Deliver by"
                                        value={fmt(cd.delivery_date)}
                                        valueStyle={overdue ? { color: '#EF4444', fontWeight: '700' } : {}}
                                    />
                                </View>
                            ) : (
                                <Text style={styles.noDetails}>No custom details found.</Text>
                            )}
                        </Card>
                    );
                })
            )}
        </ScrollView>
    );
};

// Small helper row component
const Row = ({ icon, label, value, valueStyle = {} }) => (
    <View style={styles.detailRow}>
        <Icon source={icon} size={16} color="#64748B" />
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueStyle]} numberOfLines={2}>{value}</Text>
    </View>
);

// ─── New Order form sub-component ────────────────────────────────────────────
const NewOrderForm = ({ onSuccess }) => {
    const [customerName, setCustomerName]   = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [itemWanted, setItemWanted]       = useState('');
    const [quantity, setQuantity]           = useState('1');
    const [price, setPrice]                 = useState('0');
    const [deliveryDate, setDeliveryDate]   = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading]             = useState(false);

    const handleSubmit = async () => {
        if (!customerName.trim() || !itemWanted.trim() || !quantity || !deliveryDate) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        setLoading(true);
        try {
            await client.post('orders/orders/', {
                status: 'PENDING',
                order_type: 'CUSTOM',
                total_amount: parseFloat(price) || 0,
                custom_details: {
                    customer_name: customerName.trim(),
                    customer_phone: customerPhone.trim(),
                    item_wanted: itemWanted.trim(),
                    quantity: parseInt(quantity, 10),
                    price: parseFloat(price) || 0,
                    delivery_date: deliveryDate + 'T12:00:00Z',
                },
            });
            Alert.alert('Success', 'Custom order created! Baker will be notified.');
            setCustomerName(''); setCustomerPhone('');
            setItemWanted(''); setQuantity('1');
            setPrice('0');
            setDeliveryDate(new Date().toISOString().split('T')[0]);
            onSuccess?.();
        } catch (err) {
            console.error('Create custom order failed:', err);
            Alert.alert('Error', 'Failed to create custom order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.formScroll}>
            <Card style={styles.formCard}>
                <Card.Content>
                    <Text style={styles.formTitle}>New Custom Order</Text>
                    <Text style={styles.formSubtitle}>For walk-in or phone-in customers</Text>

                    <TextInput label="Customer Name *" value={customerName} onChangeText={setCustomerName}
                        mode="outlined" style={styles.input} left={<TextInput.Icon icon="account" />} />

                    <TextInput label="Customer Phone (Optional)" value={customerPhone} onChangeText={setCustomerPhone}
                        mode="outlined" keyboardType="phone-pad" style={styles.input}
                        left={<TextInput.Icon icon="phone" />} />

                    <TextInput label="Item Wanted *" value={itemWanted} onChangeText={setItemWanted}
                        mode="outlined" multiline numberOfLines={3} style={styles.input}
                        left={<TextInput.Icon icon="food-croissant" />} />

                    <View style={styles.row}>
                        <View style={styles.flexHalf}>
                            <TextInput label="Quantity *" value={quantity} onChangeText={setQuantity}
                                mode="outlined" keyboardType="numeric" style={styles.input}
                                left={<TextInput.Icon icon="numeric" />} />
                        </View>
                        <View style={styles.flexHalf}>
                            <TextInput label="Price (₹)" value={price} onChangeText={setPrice}
                                mode="outlined" keyboardType="numeric" style={styles.input}
                                left={<TextInput.Icon icon="currency-inr" />} />
                        </View>
                    </View>
                    <HelperText type="info">Estimated price agreed with the customer.</HelperText>

                    <TextInput label="Delivery Date (YYYY-MM-DD) *" value={deliveryDate} onChangeText={setDeliveryDate}
                        mode="outlined" style={styles.input} left={<TextInput.Icon icon="calendar" />} />

                    <Button
                        mode="contained" onPress={handleSubmit} loading={loading}
                        disabled={loading} style={styles.submitBtn} buttonColor="#4D96FF"
                        icon="send"
                    >
                        Submit Custom Order
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
const CustomOrderScreen = () => {
    const [view, setView] = useState('new');

    return (
        <View style={styles.container}>
            <View style={styles.toggleBar}>
                <SegmentedButtons
                    value={view}
                    onValueChange={setView}
                    buttons={[
                        { value: 'new',   label: 'New Order', icon: 'plus-circle-outline' },
                        { value: 'track', label: 'Track Orders', icon: 'map-marker-path'  },
                    ]}
                    style={styles.segmented}
                />
            </View>

            {view === 'new'
                ? <NewOrderForm onSuccess={() => setView('track')} />
                : <TrackingView />
            }
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#F8FAFC' },
    toggleBar:       { padding: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    segmented:       {},

    // Form
    formScroll:      { padding: 16, paddingBottom: 40 },
    formCard:        { backgroundColor: '#FFFFFF', borderRadius: 16, elevation: 2 },
    formTitle:       { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    formSubtitle:    { fontSize: 13, color: '#64748B', marginBottom: 16 },
    input:           { marginBottom: 12, backgroundColor: '#FFFFFF' },
    row:             { flexDirection: 'row', justifyContent: 'space-between' },
    flexHalf:        { width: '48%' },
    submitBtn:       { marginTop: 12, paddingVertical: 6, borderRadius: 10 },

    // Tracking
    trackScroll:     { padding: 12, paddingBottom: 40 },
    chipRow:         { marginBottom: 14 },
    filterChip:      { marginRight: 8, backgroundColor: '#F1F5F9' },
    filterChipText:  { fontSize: 12, color: '#475569' },

    orderCard:       { backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 2, marginBottom: 14, padding: 14 },
    overdueCard:     { borderWidth: 1.5, borderColor: '#EF4444' },
    cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId:         { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    orderDate:       { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    headerRight:     { alignItems: 'flex-end', gap: 4 },
    statusChip:      { height: 28 },
    statusChipText:  { fontSize: 12, fontWeight: '700' },
    overdueChip:     { backgroundColor: '#FEE2E2', height: 24 },
    overdueChipText: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

    detailGrid:      { gap: 8 },
    detailRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailLabel:     { fontSize: 13, color: '#64748B', width: 90 },
    detailValue:     { fontSize: 13, color: '#1E293B', fontWeight: '600', flex: 1 },

    emptyBox:        { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText:       { color: '#94A3B8', fontSize: 16 },
    noDetails:       { color: '#94A3B8', fontStyle: 'italic' },
});

export default CustomOrderScreen;
