import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, List, Button, Title, Paragraph, IconButton, Divider } from 'react-native-paper';
import { useCart } from '../context/CartContext';
import client from '../api/client';

const CartScreen = ({ onClose }) => {
    const { cart, removeFromCart, updateQuantity, clearCart, totalCost } = useCart();
    const [loading, setLoading] = useState(false);

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
                status: 'PENDING',
                order_type: 'ONLINE',
                total_amount: totalCost,
                payment_status: true, // Simulating a successful online payment
                items: items
            });
            clearCart();
            Alert.alert("Success", "Your order has been placed!");
            onClose();
        } catch (e) {
            console.error('Checkout failed', e);
            Alert.alert("Error", "Failed to place order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="Your Cart" />
                <Appbar.Action icon="delete-sweep" onPress={clearCart} />
            </Appbar.Header>
            <ScrollView style={styles.scroll}>
                {cart.length === 0 ? (
                    <Paragraph style={styles.empty}>Your cart is empty.</Paragraph>
                ) : (
                    cart.map((item, idx) => (
                        <View key={idx}>
                            <List.Item
                                title={item.product.name}
                                description={`₹${item.product.price} each`}
                                right={props => (
                                    <View style={styles.actions}>
                                        <IconButton icon="minus" size={20} onPress={() => updateQuantity(item.product.id, item.quantity - 1)} />
                                        <Title style={{ marginHorizontal: 10 }}>{item.quantity}</Title>
                                        <IconButton icon="plus" size={20} onPress={() => updateQuantity(item.product.id, item.quantity + 1)} />
                                        <IconButton icon="delete" size={20} iconColor="red" onPress={() => removeFromCart(item.product.id)} />
                                    </View>
                                )}
                            />
                            <Divider />
                        </View>
                    ))
                )}
            </ScrollView>
            <View style={styles.footer}>
                <Title style={styles.total}>Total: ₹{totalCost.toFixed(2)}</Title>
                <Button 
                    mode="contained" 
                    onPress={handleCheckout} 
                    loading={loading}
                    disabled={cart.length === 0}
                    style={styles.checkoutBtn}
                >
                    Checkout (Pay)
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        padding: 10,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa',
    },
    total: {
        textAlign: 'right',
        marginBottom: 10,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D2691E'
    },
    checkoutBtn: {
        paddingVertical: 5,
    }
});

export default CartScreen;
