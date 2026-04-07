import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { Card, Title, Paragraph, Button, Appbar, Badge, FAB } from 'react-native-paper';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import CartScreen from './CartScreen';
import BulkOrderScreen from './BulkOrderScreen';

const CustomerHome = ({ onLogout }) => {
    const [products, setProducts] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showBulkOrder, setShowBulkOrder] = useState(false);
    const { cart, addToCart } = useCart();

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

    if (showCart) {
        return <CartScreen onClose={() => setShowCart(false)} />;
    }

    if (showBulkOrder) {
        return <BulkOrderScreen onClose={() => setShowBulkOrder(false)} />;
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content title="N3 BAKERS Catalog" />
                <View>
                    <Appbar.Action icon="cart" onPress={() => setShowCart(true)} />
                    <Badge style={styles.badge} visible={cartCount > 0}>{cartCount}</Badge>
                </View>
                <Appbar.Action icon="logout" onPress={onLogout} />
            </Appbar.Header>
            <ScrollView contentContainerStyle={styles.scroll}>
                {products.length === 0 ? (
                    <Paragraph style={styles.empty}>No products available right now.</Paragraph>
                ) : (
                    products.map(product => (
                        <Card key={product.id} style={styles.card}>
                            {product.image && <Card.Cover source={{ uri: product.image }} />}
                            <Card.Content>
                                <Title>{product.name}</Title>
                                <Paragraph>{product.description}</Paragraph>
                                <Title style={styles.price}>₹ {product.price}</Title>
                            </Card.Content>
                            <Card.Actions>
                                <Button onPress={() => addToCart(product)}>Add to Cart</Button>
                                <Button mode="contained" onPress={() => {}}>Buy Now</Button>
                            </Card.Actions>
                        </Card>
                    ))
                )}
            </ScrollView>
            <FAB
                style={styles.fab}
                icon="party-popper"
                label="Event / Bulk Order"
                onPress={() => setShowBulkOrder(true)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        elevation: 4,
    },
    scroll: {
        padding: 10,
    },
    card: {
        marginBottom: 15,
        elevation: 2,
    },
    price: {
        color: '#D2691E',
        fontWeight: 'bold',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
    },
    badge: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#D2691E',
    },
});

export default CustomerHome;
