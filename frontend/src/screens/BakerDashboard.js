import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Appbar, List, Button, Paragraph, Chip } from 'react-native-paper';
import client from '../api/client';

const BakerDashboard = ({ onLogout }) => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await client.get('orders/orders/');
            // Bakers only care about Preparing and Pending
            setOrders(response.data.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
        } catch (e) {
            console.error(e);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await client.patch(`orders/orders/${orderId}/`, { status });
            fetchOrders();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Kitchen View (Baker)" />
                <Appbar.Action icon="refresh" onPress={fetchOrders} />
                <Appbar.Action icon="logout" onPress={onLogout} />
            </Appbar.Header>
            <ScrollView style={styles.scroll}>
                <Title style={styles.title}>Orders to Prepare</Title>
                {orders.length === 0 ? (
                    <Paragraph style={styles.empty}>Kitchen is clear! 🥖</Paragraph>
                ) : (
                    orders.map(order => (
                        <List.Item
                            key={order.id}
                            title={`Order #${order.id}`}
                            description={order.items.map(i => `${i.product_name} x ${i.quantity}`).join(', ')}
                            left={props => (
                                <View style={styles.statusChip}>
                                    <Chip style={order.status === 'PENDING' ? styles.pendingChip : styles.prepChip}>
                                        {order.status}
                                    </Chip>
                                </View>
                            )}
                            right={props => (
                                <View style={styles.actions}>
                                    {order.status === 'PENDING' && (
                                        <Button onPress={() => updateStatus(order.id, 'PREPARING')}>Start</Button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <Button mode="contained" onPress={() => updateStatus(order.id, 'READY')}>Complete</Button>
                                    )}
                                </View>
                            )}
                            style={styles.listItem}
                        />
                    ))
                )}
            </ScrollView>
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
    title: {
        marginBottom: 10,
        fontWeight: 'bold',
    },
    listItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 10,
    },
    statusChip: {
        justifyContent: 'center',
    },
    pendingChip: {
        backgroundColor: '#ffd700',
    },
    prepChip: {
        backgroundColor: '#add8e6',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
    },
});

export default BakerDashboard;
