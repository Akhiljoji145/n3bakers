import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Appbar, List, Button, Title, Paragraph, IconButton, Divider, Searchbar, Dialog, Portal, TextInput, Text } from 'react-native-paper';
import client from '../api/client';

const POSScreen = ({ onClose }) => {
    const { width } = useWindowDimensions();
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
                        {filteredProducts.map(product => {
                            const numColumns = width > 900 ? 3 : 2; // POS has a side menu, so 3 is usually max for comfortable grid
                            const itemWidth = `${(100 / numColumns) - 2}%`;
                            
                            return (
                                <TouchableOpacity 
                                    key={product.id} 
                                    style={[styles.productItem, { width: itemWidth }]}
                                    onPress={() => addToCart(product)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.productImageContainer}>
                                        {product.image ? (
                                            <Image 
                                                source={{ uri: product.image.startsWith('http') ? product.image : `${client.defaults.baseURL.replace('/api/', '')}${product.image}` }} 
                                                style={styles.productImage} 
                                            />
                                        ) : (
                                            <View style={styles.imagePlaceholderSmall}>
                                                <Text style={styles.initials}>{product.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.productDetails}>
                                        <Text style={styles.productNameSmall} numberOfLines={1}>{product.name}</Text>
                                        <Text style={styles.productPriceSmall}>₹{product.price}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
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
    productItem: {
        aspectRatio: 1.1,
        margin: '1%',
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
        elevation: 2,
    },
    productImageContainer: {
        width: '100%',
        height: '65%',
        backgroundColor: '#f8f8f8',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholderSmall: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D2691E',
    },
    productDetails: {
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productNameSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    productPriceSmall: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D2691E',
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
