import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Appbar, List, Button, Title, Paragraph, IconButton, Divider, Text, Menu, Icon, ActivityIndicator, Surface, Card, RadioButton, Portal, Dialog } from 'react-native-paper';
import { useCart } from '../context/CartContext';
import client from '../api/client';

const CartScreen = ({ onClose }) => {
    const { 
        cart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        totalCost, 
        selectedBranch, 
        setSelectedBranch, 
        branches, 
        loadingBranches 
    } = useCart();
    const [loading, setLoading] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('COUNTER'); // Default to Pay at Counter

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!selectedBranch) {
            Alert.alert("Required", "Please select a branch to place your order.");
            return;
        }
        
        setLoading(true);
        try {
            const items = cart.map(item => ({
                product: item.product.id,
                quantity: item.quantity,
                price_at_order: item.product.price
            }));
            
            await client.post('orders/orders/', {
                status: 'PENDING',
                order_type: 'ONLINE',
                total_amount: totalCost,
                branch: selectedBranch,
                payment_status: paymentMethod === 'GATEWAY',
                items: items
            });
            
            clearCart();
            Alert.alert(
                "Order Placed!", 
                paymentMethod === 'COUNTER' 
                    ? "Your order is submitted. Please pay at the counter when you arrive."
                    : "Payment successful! Your order has been placed."
            );
            onClose();
        } catch (e) {
            console.error('Checkout failed', e);
            Alert.alert("Error", "Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const currentBranchName = (branches || []).find(b => b.id === selectedBranch)?.name || 'Not Selected';

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="Your Cart" titleStyle={styles.headerTitle} />
                <Appbar.Action icon="delete-sweep" color="#EF4444" onPress={clearCart} disabled={cart.length === 0} />
            </Appbar.Header>

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Branch Selection Section */}
                <Surface style={styles.sectionCard} elevation={1}>
                    <View style={styles.sectionHeader}>
                        <Icon source="store-marker" size={24} color="#D2691E" />
                        <Text style={styles.sectionTitle}>Pickup / Delivery Branch</Text>
                    </View>
                    <Divider style={styles.divider} />
                    {loadingBranches ? (
                        <ActivityIndicator size="small" color="#D2691E" style={{ marginVertical: 10 }} />
                    ) : (
                        <>
                            <TouchableOpacity 
                                style={[styles.picker, !selectedBranch && styles.pickerError]} 
                                onPress={() => setMenuVisible(true)}
                            >
                                <View>
                                    <Text style={styles.pickerLabel}>Selected Location:</Text>
                                    <Text style={styles.pickerValue}>{currentBranchName}</Text>
                                </View>
                                <Icon source="chevron-down" size={24} color="#D2691E" />
                            </TouchableOpacity>

                            <Portal>
                                <Dialog visible={menuVisible} onDismiss={() => setMenuVisible(false)} style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }}>
                                    <Dialog.Title style={{ fontWeight: '800', color: '#1E293B' }}>Select Pickup Branch</Dialog.Title>
                                    <Dialog.ScrollArea>
                                        <View style={{ paddingVertical: 8 }}>
                                            {branches.length === 0 ? (
                                                <Text style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>No active branches found.</Text>
                                            ) : (
                                                (branches || []).map(b => (
                                                    <TouchableOpacity
                                                        key={b.id}
                                                        onPress={() => {
                                                            setSelectedBranch(b.id);
                                                            setMenuVisible(false);
                                                        }}
                                                        disabled={!b.is_active}
                                                        style={{
                                                            flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
                                                            opacity: b.is_active ? 1 : 0.5,
                                                            backgroundColor: selectedBranch === b.id ? '#FFF7ED' : 'transparent',
                                                            borderRadius: 8,
                                                            marginBottom: 4
                                                        }}
                                                    >
                                                        <Icon 
                                                            source={selectedBranch === b.id ? "check-circle" : "store-outline"} 
                                                            color={selectedBranch === b.id ? "#D2691E" : "#64748B"} 
                                                            size={24} 
                                                        />
                                                        <View style={{ marginLeft: 12 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: selectedBranch === b.id ? '700' : '500', color: selectedBranch === b.id ? '#D2691E' : '#1E293B' }}>
                                                                {b.name}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))
                                            )}
                                        </View>
                                    </Dialog.ScrollArea>
                                    <Dialog.Actions>
                                        <Button onPress={() => setMenuVisible(false)} textColor="#64748B">Cancel</Button>
                                    </Dialog.Actions>
                                </Dialog>
                            </Portal>
                        </>
                    )}
                </Surface>

                {/* Payment Method Section */}
                <Surface style={styles.sectionCard} elevation={1}>
                    <View style={styles.sectionHeader}>
                        <Icon source="credit-card-outline" size={24} color="#D2691E" />
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                    </View>
                    <Divider style={styles.divider} />
                    
                    <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
                        <View style={styles.radioRow}>
                            <RadioButton.Item 
                                label="Pay at Counter (Cash/Card)" 
                                value="COUNTER" 
                                color="#D2691E"
                                labelStyle={styles.radioLabel}
                                style={styles.radioItem}
                            />
                            <RadioButton.Item 
                                label="Online Payment (Coming Soon)" 
                                value="GATEWAY" 
                                color="#D2691E"
                                disabled={true}
                                labelStyle={[styles.radioLabel, { color: '#94A3B8' }]}
                                style={styles.radioItem}
                            />
                        </View>
                    </RadioButton.Group>
                </Surface>

                <Title style={styles.listHeader}>Order Items ({cart.length})</Title>
                {cart.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon source="cart-outline" size={64} color="#E2E8F0" />
                        <Paragraph style={styles.empty}>Your cart is empty.</Paragraph>
                        <Button mode="text" onPress={onClose} textColor="#D2691E">Go Back to Menu</Button>
                    </View>
                ) : (
                    cart.map((item, idx) => (
                        <Card key={idx} style={styles.itemCard}>
                            <Card.Content style={styles.itemContent}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.product.name}</Text>
                                    <Text style={styles.itemPrice}>₹{item.product.price} / item</Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <IconButton icon="minus-circle-outline" size={24} iconColor="#64748B" onPress={() => updateQuantity(item.product.id, item.quantity - 1)} />
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                    <IconButton icon="plus-circle-outline" size={24} iconColor="#D2691E" onPress={() => updateQuantity(item.product.id, item.quantity + 1)} />
                                    <IconButton icon="delete-outline" size={24} iconColor="#EF4444" onPress={() => removeFromCart(item.product.id)} />
                                </View>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>

            <Surface style={styles.footer} elevation={4}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>₹{totalCost.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Title style={styles.totalLabel}>Total Amount</Title>
                    <Title style={styles.totalValue}>₹{totalCost.toFixed(2)}</Title>
                </View>
                <Button 
                    mode="contained" 
                    onPress={handleCheckout} 
                    loading={loading}
                    disabled={cart.length === 0 || !selectedBranch}
                    style={styles.checkoutBtn}
                    labelStyle={styles.checkoutBtnLabel}
                    buttonColor="#D2691E"
                >
                    Place Order →
                </Button>
            </Surface>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { backgroundColor: '#FFFFFF', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontWeight: '800', color: '#1E293B', fontSize: 18 },
    scroll: { flex: 1 },
    sectionCard: { margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    divider: { marginBottom: 12 },
    picker: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: '#F8FAFC', 
        padding: 12, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    pickerError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    pickerLabel: { fontSize: 12, color: '#64748B' },
    pickerValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    radioRow: { marginTop: 4 },
    radioItem: { paddingVertical: 0, paddingHorizontal: 0 },
    radioLabel: { fontSize: 15, color: '#1E293B' },
    listHeader: { marginLeft: 16, marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: '700', color: '#475569' },
    itemCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, elevation: 1 },
    itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    itemPrice: { fontSize: 13, color: '#64748B', marginTop: 2 },
    itemActions: { flexDirection: 'row', alignItems: 'center' },
    qtyText: { fontSize: 16, fontWeight: '800', minWidth: 20, textAlign: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    empty: { textAlign: 'center', marginTop: 16, fontSize: 16, color: '#94A3B8' },
    footer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFFFFF' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: '#64748B', fontSize: 14 },
    summaryValue: { fontWeight: '600', color: '#1E293B' },
    totalLabel: { color: '#1E293B', fontWeight: '800' },
    totalValue: { color: '#D2691E', fontWeight: '900', fontSize: 24 },
    checkoutBtn: { marginTop: 12, borderRadius: 12, paddingVertical: 6 },
    checkoutBtnLabel: { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default CartScreen;
