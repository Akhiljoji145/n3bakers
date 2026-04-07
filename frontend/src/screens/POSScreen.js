import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, List, Button, Title, Paragraph, IconButton, Divider, Searchbar, Dialog, Portal, TextInput } from 'react-native-paper';
import client from '../api/client';

const POSScreen = ({ onClose }) => {
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
            console.error(e);
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
                status: 'COMPLETED', // POS bills are usually completed instantly
                order_type: 'POS',
                total_amount: totalCost,
                payment_status: true,
                items: items
            });
            
            Alert.alert("Success", "Bill generated successfully!");
            setCart([]);
            setPaymentVisible(false);
            setAmountReceived('');
        } catch (e) {
            console.error('Checkout failed', e);
            Alert.alert("Error", "Failed to generate bill.");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.includes(searchQuery));

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="Fast POS Billing" />
            </Appbar.Header>
            
            <View style={styles.mainLayout}>
                {/* Left Side: Products Catalog */}
                <View style={styles.catalogSide}>
                    <Searchbar
                        placeholder="Search items or barcode..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchbar}
                    />
                    <ScrollView contentContainerStyle={styles.productGrid}>
                        {filteredProducts.map(product => (
                            <Button 
                                key={product.id} 
                                mode="outlined" 
                                style={styles.productBtn}
                                contentStyle={styles.productBtnContent}
                                labelStyle={styles.productBtnLabel}
                                onPress={() => addToCart(product)}
                            >
                                {product.name}{'\n'}₹{product.price}
                            </Button>
                        ))}
                    </ScrollView>
                </View>

                {/* Right Side: Current Bill */}
                <View style={styles.billSide}>
                    <Title style={styles.billTitle}>Current Bill</Title>
                    <Divider />
                    <ScrollView style={styles.billScroll}>
                        {cart.length === 0 ? (
                            <Paragraph style={styles.empty}>No items added.</Paragraph>
                        ) : (
                            cart.map((item, idx) => (
                                <View key={idx} style={styles.billItemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Paragraph style={{ fontWeight: 'bold' }}>{item.product.name}</Paragraph>
                                        <Paragraph>₹{item.product.price} x {item.quantity}</Paragraph>
                                    </View>
                                    <View style={styles.actions}>
                                        <IconButton icon="minus" size={16} onPress={() => updateQuantity(item.product.id, -1)} />
                                        <Title style={{ fontSize: 16 }}>{item.quantity}</Title>
                                        <IconButton icon="plus" size={16} onPress={() => updateQuantity(item.product.id, 1)} />
                                    </View>
                                    <Paragraph style={{ fontWeight: 'bold', width: 60, textAlign: 'right' }}>
                                        ₹{(item.product.price * item.quantity).toFixed(2)}
                                    </Paragraph>
                                </View>
                            ))
                        )}
                    </ScrollView>
                    <View style={styles.footer}>
                        <Title style={styles.total}>Total: ₹{totalCost.toFixed(2)}</Title>
                        <Button 
                            mode="contained" 
                            style={styles.payBtn}
                            disabled={cart.length === 0}
                            onPress={() => setPaymentVisible(true)}
                        >
                            PAY & GENERATE BILL
                        </Button>
                    </View>
                </View>
            </View>

            <Portal>
                <Dialog visible={paymentVisible} onDismiss={() => setPaymentVisible(false)}>
                    <Dialog.Title>Collect Payment</Dialog.Title>
                    <Dialog.Content>
                        <Title>Bill Amount: ₹{totalCost.toFixed(2)}</Title>
                        <TextInput
                            label="Amount Received (Cash)"
                            value={amountReceived}
                            onChangeText={setAmountReceived}
                            keyboardType="numeric"
                            mode="outlined"
                            style={{ marginTop: 10 }}
                        />
                        {parseFloat(amountReceived) >= totalCost && (
                            <Paragraph style={{ color: 'green', marginTop: 10, fontWeight: 'bold' }}>
                                Change to return: ₹{(parseFloat(amountReceived) - totalCost).toFixed(2)}
                            </Paragraph>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setPaymentVisible(false)}>Cancel</Button>
                        <Button onPress={handleCheckout} loading={loading}>Complete Transaction</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        elevation: 4,
    },
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },
    catalogSide: {
        flex: 2,
        borderRightWidth: 1,
        borderRightColor: '#eee',
        padding: 10,
    },
    searchbar: {
        marginBottom: 10,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    productBtn: {
        margin: 5,
        width: '30%',
        height: 80,
        justifyContent: 'center',
        borderColor: '#D2691E'
    },
    productBtnContent: {
        height: '100%',
    },
    productBtnLabel: {
        textAlign: 'center',
        fontSize: 14,
    },
    billSide: {
        flex: 1,
        backgroundColor: '#fafafa',
        padding: 10,
    },
    billTitle: {
        textAlign: 'center',
        marginBottom: 10,
    },
    billScroll: {
        flex: 1,
        marginVertical: 10,
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
    },
    billItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#ddd',
    },
    total: {
        textAlign: 'right',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D2691E',
        marginBottom: 10,
    },
    payBtn: {
        paddingVertical: 8,
        backgroundColor: '#4CAF50',
    }
});

export default POSScreen;
