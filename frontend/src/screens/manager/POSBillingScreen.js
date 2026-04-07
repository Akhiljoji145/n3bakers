import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { List, Button, Title, Paragraph, IconButton, Divider, Searchbar, Dialog, Portal, TextInput, Card, Text, Surface } from 'react-native-paper';
import client from '../../api/client';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const POSBillingScreen = () => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Payment Dialog
    const [paymentVisible, setPaymentVisible] = useState(false);
    const [amountReceived, setAmountReceived] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await client.get('core/products/');
            setProducts(response.data);
        } catch (e) {
            console.error('Fetch products error:', e);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, change) => {
        setCart(prev => {
            const result = prev.map(item => {
                if (item.product.id === productId) {
                    return { ...item, quantity: Math.max(0, item.quantity + change) };
                }
                return item;
            });
            return result.filter(item => item.quantity > 0);
        });
    };

    const totalCost = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            const items = cart.map(item => ({
                product: item.product.id,
                quantity: item.quantity,
                price_at_order: item.product.price
            }));
            
            await client.post('orders/orders/', {
                status: 'DELIVERED', // Walk-in POS orders skip PREPARING and directly mark DELIVERED
                order_type: 'POS',
                total_amount: totalCost,
                payment_status: true,
                items: items
            });
            
            if (Platform.OS === 'web') {
                alert("Success: Bill generated successfully!");
            } else {
                Alert.alert("Success", "Bill generated successfully!");
            }
            
            setCart([]);
            setPaymentVisible(false);
            setAmountReceived('');
        } catch (e) {
            console.error('Checkout failed', e);
            if (Platform.OS === 'web') alert("Error: Failed to generate bill.");
            else Alert.alert("Error", "Failed to generate bill.");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.is_available);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <View style={isTablet ? styles.tabletLayout : styles.mobileLayout}>
                {/* Left Side: Products Catalog */}
                <View style={isTablet ? styles.catalogSideTablet : styles.catalogSideMobile}>
                    <Searchbar
                        placeholder="Search products..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchbar}
                        iconColor="#D2691E"
                    />
                    <ScrollView contentContainerStyle={styles.productGrid}>
                        {filteredProducts.map(product => (
                            <Card key={product.id} style={styles.productCard} onPress={() => addToCart(product)}>
                                <Card.Content style={styles.productCardContent}>
                                    <Title style={styles.productName} numberOfLines={2}>{product.name}</Title>
                                    <Title style={styles.productPrice}>₹ {product.price}</Title>
                                </Card.Content>
                            </Card>
                        ))}
                        {filteredProducts.length === 0 && <Paragraph style={styles.emptyText}>No products found.</Paragraph>}
                    </ScrollView>
                </View>

                {/* Right/Bottom Side: Current Bill Basket */}
                <Surface style={isTablet ? styles.billSideTablet : styles.billSideMobile} elevation={4}>
                    <View style={styles.billHeader}>
                        <Title style={styles.billTitle}>Current Order</Title>
                        <Button mode="text" textColor="#EF4444" onPress={() => setCart([])} disabled={cart.length===0}>Clear</Button>
                    </View>
                    <Divider />
                    <ScrollView style={styles.billScroll}>
                        {cart.length === 0 ? (
                            <Paragraph style={styles.emptyText}>Tap a product to add it to the cart.</Paragraph>
                        ) : (
                            cart.map((item, idx) => (
                                <View key={idx} style={styles.billItemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.billItemName} numberOfLines={1}>{item.product.name}</Text>
                                        <Text style={styles.billItemSub}>₹{item.product.price}</Text>
                                    </View>
                                    <View style={styles.actions}>
                                        <IconButton icon="minus-box" size={24} iconColor="#64748B" onPress={() => updateQuantity(item.product.id, -1)} />
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                        <IconButton icon="plus-box" size={24} iconColor="#D2691E" onPress={() => updateQuantity(item.product.id, 1)} />
                                    </View>
                                    <Text style={styles.itemTotalAmount}>
                                        ₹{(item.product.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Title style={styles.totalLabel}>Grand Total</Title>
                            <Title style={styles.totalAmount}>₹{totalCost.toFixed(2)}</Title>
                        </View>
                        <Button 
                            mode="contained" 
                            style={[styles.payBtn, cart.length === 0 && {backgroundColor: '#CBD5E1'}]}
                            labelStyle={styles.payBtnLabel}
                            disabled={cart.length === 0}
                            onPress={() => setPaymentVisible(true)}
                        >
                            CHARGE ₹{totalCost.toFixed(2)}
                        </Button>
                    </View>
                </Surface>
            </View>

            <Portal>
                <Dialog visible={paymentVisible} onDismiss={() => setPaymentVisible(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Collect Payment</Dialog.Title>
                    <Dialog.Content>
                        <View style={styles.paymentHighlight}>
                            <Text style={styles.highlightText}>Total Due</Text>
                            <Text style={styles.highlightAmount}>₹{totalCost.toFixed(2)}</Text>
                        </View>
                        <TextInput
                            label="Cash Received"
                            value={amountReceived}
                            onChangeText={setAmountReceived}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                            activeOutlineColor="#D2691E"
                        />
                        {parseFloat(amountReceived) >= totalCost && (
                            <View style={styles.changeBox}>
                                <Text style={styles.changeLabel}>Change matching required:</Text>
                                <Text style={styles.changeAmount}>₹{(parseFloat(amountReceived) - totalCost).toFixed(2)}</Text>
                            </View>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions style={{ padding: 16 }}>
                        <Button onPress={() => setPaymentVisible(false)} textColor="#64748B">Cancel</Button>
                        <Button mode="contained" onPress={handleCheckout} loading={loading} buttonColor="#10B981" style={{ paddingHorizontal: 16 }}>Confirm Checkout</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    tabletLayout: { flex: 1, flexDirection: 'row' },
    mobileLayout: { flex: 1, flexDirection: 'column' },
    catalogSideTablet: { flex: 2, padding: 16, borderRightWidth: 1, borderRightColor: '#E2E8F0' },
    catalogSideMobile: { flex: 1, padding: 10 },
    searchbar: { marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 12 },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    productCard: { width: isTablet ? '31%' : '48%', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, elevation: 2 },
    productCardContent: { padding: 12, alignItems: 'center', justifyContent: 'center', height: 100 },
    productName: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#D2691E', marginTop: 8 },
    billSideTablet: { flex: 1, backgroundColor: '#FFFFFF' },
    billSideMobile: { height: 350, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    billTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    billScroll: { flex: 1, paddingHorizontal: 16 },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40 },
    billItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    billItemName: { fontSize: 15, fontWeight: '600', color: '#334155' },
    billItemSub: { fontSize: 13, color: '#64748B' },
    actions: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
    quantityText: { fontSize: 18, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
    itemTotalAmount: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', width: 70, textAlign: 'right' },
    footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
    totalLabel: { fontSize: 18, color: '#64748B' },
    totalAmount: { fontSize: 28, fontWeight: '900', color: '#D2691E' },
    payBtn: { borderRadius: 12, backgroundColor: '#D2691E', paddingVertical: 8 },
    payBtnLabel: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { textAlign: 'center', fontWeight: 'bold' },
    paymentHighlight: { backgroundColor: '#FFF7ED', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    highlightText: { fontSize: 16, color: '#D2691E', fontWeight: '600' },
    highlightAmount: { fontSize: 32, fontWeight: 'bold', color: '#D2691E' },
    input: { backgroundColor: '#FFFFFF' },
    changeBox: { marginTop: 16, padding: 12, backgroundColor: '#ECFDF5', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
    changeLabel: { color: '#065F46', fontSize: 14, fontWeight: '600' },
    changeAmount: { color: '#065F46', fontSize: 16, fontWeight: 'bold' }
});

export default POSBillingScreen;
